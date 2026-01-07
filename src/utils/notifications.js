import { supabase } from 'boot/supabase'

// Solicita permisos para notificaciones push
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Calcula las fechas de notificación (8, 5 y 3 días antes)
export function calculateNotificationDates(payDate) {
  const dates = []
  const payDateObj = new Date(payDate)
  
  // 8 días antes
  const date8 = new Date(payDateObj)
  date8.setDate(date8.getDate() - 8)
  dates.push({ days: 8, date: date8 })
  
  // 5 días antes
  const date5 = new Date(payDateObj)
  date5.setDate(date5.getDate() - 5)
  dates.push({ days: 5, date: date5 })
  
  // 3 días antes
  const date3 = new Date(payDateObj)
  date3.setDate(date3.getDate() - 3)
  dates.push({ days: 3, date: date3 })
  
  return dates
}

// Programa notificaciones para un compromiso
export async function scheduleCommitmentNotifications(commitment) {
  if (!commitment.status || !commitment.pay_date) {
    return
  }

  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    console.log('No hay permisos para notificaciones')
    return
  }

  const notificationDates = calculateNotificationDates(commitment.pay_date)
  const now = new Date()

  notificationDates.forEach(({ days, date }) => {
    if (date > now) {
      // Calcular delay en milisegundos
      const delay = date.getTime() - now.getTime()
      
      // Programar notificación
      setTimeout(() => {
        showNotification(commitment, days)
      }, delay)
      
      console.log(`Notificación programada para ${commitment.name} - ${days} días antes:`, date)
    }
  })
}

// Muestra una notificación
function showNotification(commitment, daysRemaining) {
  if (Notification.permission === 'granted') {
    const notification = new Notification('Recordatorio de Pago', {
      body: `${commitment.name} - Pago en ${daysRemaining} días\nMonto: $${formatAmount(commitment.amount)}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-128x128.png',
      tag: `commitment-${commitment.id}-${daysRemaining}`,
      requireInteraction: true,
      data: {
        commitment_id: commitment.id,
        days_remaining: daysRemaining
      }
    })

    notification.onclick = function() {
      window.focus()
      window.location.href = '/#/commitments'
      this.close()
    }
  }
}

// Formatea el monto
function formatAmount(amount) {
  const num = Math.round(Number(amount || 0))
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Programa notificaciones para todos los compromisos activos
export async function scheduleAllCommitments(userId) {
  try {
    const { data: commitments, error } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', true)

    if (error) throw error

    if (commitments && commitments.length > 0) {
      commitments.forEach(commitment => {
        scheduleCommitmentNotifications(commitment)
      })
      console.log(`${commitments.length} compromisos programados para notificaciones`)
    }
  } catch (error) {
    console.error('Error programando notificaciones:', error)
  }
}

// Verifica notificaciones diarias (para ejecutar al iniciar la app)
export async function checkDailyNotifications(userId) {
  try {
    const { data: commitments, error } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', true)

    if (error) throw error

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    commitments?.forEach(commitment => {
      const payDate = new Date(commitment.pay_date)
      payDate.setHours(0, 0, 0, 0)
      
      const daysUntilPayment = Math.ceil((payDate - today) / (1000 * 60 * 60 * 24))
      
      // Si faltan exactamente 8, 5 o 3 días, mostrar notificación
      if ([8, 5, 3].includes(daysUntilPayment)) {
        showNotification(commitment, daysUntilPayment)
      }
    })
  } catch (error) {
    console.error('Error verificando notificaciones:', error)
  }
}

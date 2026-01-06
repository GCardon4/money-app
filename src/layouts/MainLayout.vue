<template>
  <q-layout view="lHh Lpr lFf">

    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> 
           <q-icon name="account_balance_wallet" color="white" /> My Money App
        </q-toolbar-title>

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated>
        <q-banner 
          inline-actions
          dense
          class="bg-primary text-white"
        >
          <template v-slot:avatar>
            <q-icon name="get_app" size="2rem" />
          </template>
          <b>Instala la Aplicación</b>

          <template v-slot:action>
            <q-btn flat label="Instalar" dense />
            <q-btn flat label="Cancelar" dense />
          </template>
        </q-banner>
    </q-footer>


  </q-layout>
</template>

<script setup>

</script>

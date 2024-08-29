<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-white text-grey-10">
      <app-toolbar @toggle="toggleLeftDrawer" />
    </q-header>

    <q-drawer v-model="mapStore.showDrawer" overlay elevated width="400">
      <layers-drawer />
      <div class="absolute" style="top: 10px; right: 15px">
        <q-btn dense round unelevated icon="close" @click="toggleLeftDrawer" />
      </div>
    </q-drawer>

    <q-drawer
      v-model="helpStore.show"
      side="right"
      :width="$q.screen.lt.md ? 300 : 500"
      overlay
      elevated
    >
      <help-drawer />
      <div class="absolute" style="top: 10px; right: 10px">
        <q-btn dense round unelevated icon="close" @click="toggleRightDrawer" />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer>
      <div class="row text-grey-8">
        <div class="col-12 col-md-3 bg-grey-2"></div>
        <div class="col-12 col-md-9 bg-white">
          <time-axis class="q-pl-sm q-pr-sm" />
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import AppToolbar from 'src/components/AppToolbar.vue';
import LayersDrawer from 'src/components/LayersDrawer.vue';
import HelpDrawer from 'src/components/HelpDrawer.vue';
import TimeAxis from 'src/components/charts/TimeAxis.vue';

const mapStore = useMapStore();
const helpStore = useHelpStore();

function toggleLeftDrawer() {
  mapStore.showDrawer = !mapStore.showDrawer;
}

function toggleRightDrawer() {
  helpStore.show = !helpStore.show;
}
</script>

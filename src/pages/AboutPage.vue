<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">About</div>
    <div>
      TODO
    </div>
  </q-page>
</template>

<script setup lang="ts">

const stylingMd = `### Style and identity
* [Quasar: Style and identity](https://quasar.dev/docs)
* [EPFL brand identity guidelines](https://inside.epfl.ch/corp-id/en/brand-identity-guidelines/)
`;

const content = ref();

onMounted(async () => {
  const response = await fetch(ReadmeMd);
  content.value = await response.text();
});
</script>

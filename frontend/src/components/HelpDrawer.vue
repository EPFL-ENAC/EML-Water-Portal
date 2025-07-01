<template>
  <q-markdown
    no-heading-anchor-links
    :src="helpStore.content"
    class="q-pl-md q-pr-md"
  />
</template>

<script setup lang="ts">
const helpStore = useHelpStore();
</script>

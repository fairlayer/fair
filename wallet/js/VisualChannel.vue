<template>
  <div v-if="derived.bar > 0" class="progress" style="width:90%; display:inline-flex">

    <div v-bind:style="{ width: Math.round(derived.they_uninsured*100/derived.bar)+'%', 'background-color':'#0000FF'}" class="progress-bar" role="progressbar">
      {{commy(derived.they_uninsured, true, false)}} (they_uninsured)
    </div>
    <div class="progress-bar" v-bind:style="{ width: Math.round(derived.insured*100/derived.bar)+'%', 'background-color':'#5cb85c'}" role="progressbar">
      {{commy(derived.insured, true, false)}} (insured)
    </div>
    <div v-bind:style="{ width: Math.round(derived.they_insured*100/derived.bar)+'%', 'background-color':'#007bff'}" class="progress-bar" role="progressbar">
      {{commy(derived.they_insured, true, false)}} (they_insured)
    </div>
    <div v-bind:style="{ width: Math.round(derived.uninsured*100/derived.bar)+'%', 'background-color':'#dc3545'}" class="progress-bar" role="progressbar">
      {{commy(derived.uninsured, true, false)}} (uninsured)
    </div>
  </div>
</template>

<script>
export default {
  props: {
    derived: Object
  },
  data() {
    return {}
  },
  methods: {
  }
}
</script>

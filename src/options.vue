<template>
	<div class="form-grid">
		<div class="field full">
			<p class="type-label">Display template</p>
			<v-field-template :collection="relations.length > 1 ? relations[0].collection : relations[0].related_collection" :model-value="value.template" @update:modelValue="handleChange($event)" />
		</div>
	</div>
</template>
<script>
    export default {
        emits: ['input'],
        inject: ['system'],
        props: {
            value: Object,
            collection: String,
            relatedCollection: String,
            fieldData:Object,
            relations:Array,
        },
        methods: {
            handleChange(value) {
                this.$emit('input', {
					template: value, 
				});
            },
        },
		created : function ()
		{
			console.log(this.relations.length > 1 ? this.relations[0].collection : this.relations[0].related_collection); 
		},
    };
</script>
<template>
	<span v-if="result">{{ result }}</span>
	<span v-else-if="isLoading" class="null">Loading...</span>
	<span v-else class="null">--</span>
</template>

<script>
export default {
	inject: ["system"],
	props: {
		value: String,
		interface: String,
		collection: String,
		field: String,
		interfaceOptions: Array,
		type: String
	},
	data : function ()
	{
		return {
			result : null,
			isLoading : true
		};
	},
	methods: {
		requestData : async function (_template)
		{
			let fields = ['languages_code'];
			
			Object.keys(_template.paths).map(_item =>
			{
				fields.push(this.field + '.' + _item);
				fields.push(this.field + '.' + _item.split('.').slice(0, -1).join('.') + '.languages_code');
			});
			
			let data = await this.system.api.get(`/items/${this.collection}?fields=${fields.join(',')}&filter[${this.field}][id][_in]=${Array.isArray(this.value) ? this.value.join(',') : this.value}`);
			
			return data.data.data[0];
		},
		parseTemplate : function (_template)
		{
			const result = {
				template : _template.replace(/\{\{\t?([a-z0-9_\.]+)\t?\}\}/ig, '{{$1}}'),
				maxDepth : 0,
				paths : {}
			};
			
			const matches = result.template.match(/\{\{\t?[a-z0-9_\.]+\t?\}\}/ig) || [];
			
			matches.forEach(_item => 
			{
				_item = _item.substring(2, _item.length - 2);
				
				result.paths[_item] = true;
				result.maxDepth = Math.max(result.maxDepth, _item.split('.').length);
			});
			
			result.paths = result.paths;
			
			return result;
		},
		filterLang : function (_array)
		{
			for (let i in _array)
			{
				if (typeof _array[i].languages_code === 'string' &&
					_array[i].languages_code === this.system.useUserStore().state.currentUser.language
				)
				{
					return _array[i];
				}
			}
			
			return _array[0];
		},
		resolvePath : function (_data, _path, _level)
		{
			_level = _level || 0;
			
			if (_path.length === _level)
			{
				return _data;
			}
			
			if (typeof _data === 'object')
			{
				if (Array.isArray(_data))
				{
					if (_data.length > 0)
					{
						if (_path[_level - 1] === 'translations')
						{
							return this.resolvePath(
								this.filterLang(_data),
								_path,
								_level
							);
						}
						else
						{
							let array = [];
							
							_data.forEach((_item, _index) =>
							{
								array.push(
									this.resolvePath(
										_item,
										_path,
										_level
									)
								);
							});
							
							return array.join(',');
						}
					}
					else
					{
						return null;
					}
				}
				else
				{
					if (typeof _data[_path[_level]] !== 'undefined')
					{
						return this.resolvePath(
							_data[_path[_level]],
							_path,
							_level + 1
						);
					}
					else
					{
						return null;
					}
				}
			}
			
			return null;
		}
	},
	created : async function ()
	{
		const template_ = this.parseTemplate(this.$attrs.template);
		const data = await this.requestData(template_);
		
		let pathArray;
		
		for (let path in template_.paths)
		{
			pathArray = path.split('.');
			pathArray.unshift(this.field);
			
			template_.paths[path] = this.resolvePath(data, pathArray);
			template_.compiled = template_.template.replaceAll(`{{${path}}}`, template_.paths[path]).trim();
		}
		
		this.result = template_.compiled;
		this.isLoading = false;
	}
};
</script>

<style lang="scss" scoped>
.null {
	color: var(--border-normal);
}
</style>
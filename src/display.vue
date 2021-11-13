<template>
	<span v-if="result" v-html="result"></span>
	<span v-else-if="isLoading" class="null">{{ t('loading') }}</span>
	<span v-else class="null">--</span>
</template>

<script>
import { useI18n } from 'vue-i18n';

export default {
	inject: ['api', 'stores'],
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
	setup (props)
	{
		const { t } = useI18n();
		
		return { t };
	},
	methods: {
		aggregation : function (_uri, _id)
		{
			return new Promise(async (_resolve, _reject) => 
			{
				const timeLimit = 500;
				let propertyName = '__directusTranslationsDisplay';
				
				window[propertyName] = typeof window[propertyName] != 'undefined' ? window[propertyName] : {};
				
				if (typeof window[propertyName][_uri] !== 'object')
				{
					window[propertyName][_uri] = {
						initTime : new Date().getTime(),
						ids : [],
						callbacks : []
					};
				}
				
				window[propertyName][_uri].ids.push(_id);
				window[propertyName][_uri].callbacks.push(_resolve);
				
				let check = async function ()
				{
					let data = window[propertyName][_uri];
					
					if (!data)
					{
						return;
					}
					
					if (new Date().getTime() - data.initTime >= timeLimit)
					{
						delete window[propertyName][_uri];
						
						let result = await this.api.get(`${_uri}${data.ids.join(',')}`);
						let filtered, arr, j;
						
						for (let i in data.callbacks)
						{
							// data filtering
							filtered = {};
							
							for (j = 0; j < result.data.data.length; j++)
							{
								arr = result.data.data[j][this.field];
								//arr = Array.isArray(arr) ? arr : (arr.translations || []);
								
								if (Array.isArray(arr))
								{
									for (let k in arr)
									{
										if (arr[k].id === data.ids[i])
										{
											filtered[data.ids[i]] = result.data.data[j];
										}
									}
								}
								else
								{
									if (arr.id === data.ids[i])
									{
										filtered[data.ids[i]] = result.data.data[j];
									}
								}
							}
							
							//console.log(data.ids[i], Object.values(filtered));
							data.callbacks[i](Object.values(filtered));
							
							/*
							data.callbacks[i](result.data.data.filter((_item) => 
							{
								let arr = eval(`_item.${this.field}`);
									arr = Array.isArray(arr) ? arr : (arr.translations || []);
								
								for (let k in arr)
								{
									if (arr[k].id === data.ids[i])
									{
										return true;
									}
								}
								
								return false;
							}));
							*/
						}
					}
				};
				
				check();
				setTimeout(check.bind(this), timeLimit);
				
			});
		},
		requestData : async function (_template)
		{
			let fields = ['languages_code'];
			
			Object.keys(_template.paths).map(_item =>
			{
				fields.push(this.field + '.id');
				fields.push(this.field + '.' + _item);
				
				let tmp = _item.split('.').slice(0, -1).join('.');
				
				if (tmp)
				{
					fields.push(this.field + '.' + tmp + '.id');
					fields.push(this.field + '.' + tmp + '.languages_code');
				}
				else
				{
					fields.push(this.field + '.id');
					fields.push(this.field + '.languages_code');
				}
			});
			
			let data = await this.aggregation(
				`/items/${this.collection}?fields=${fields.join(',')}&filter[${this.field}][id][_in]=`,
				Array.isArray(this.value) ? this.value[0] : this.value
			);
			
			return data;
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
					_array[i].languages_code === this.stores.useUserStore().currentUser.language
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
						if (_data.every(_item => typeof _item === 'object' && typeof _item.languages_code !== 'undefined') ||
							_level == 0
						)
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
							
							return array.join(', ');
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
		const internalDataFlag = Array.isArray(this.value) && typeof this.value[0] !== 'number';
		const data = internalDataFlag ? this.value : await this.requestData(template_);
		let pathArray;
		
		template_.compiled = template_.template;
		
		for (let path in template_.paths)
		{
			pathArray = path.split('.');
			
			if (!internalDataFlag)
			{
				pathArray.unshift(this.field);
			}
			
			//console.log(pathArray, data);
			
			template_.paths[path] = this.resolvePath(data, pathArray);
			template_.compiled = template_.compiled.replaceAll(`{{${path}}}`, template_.paths[path] ? template_.paths[path] : `<span class="null">--</span>`).trim();
		}
		
		this.result = template_.compiled;
		this.isLoading = false;
	}
};
</script>

<style lang="css" scoped>
.null,
:deep(.null) {
	color: var(--border-normal);
}
</style>
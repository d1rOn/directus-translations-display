import DisplayComponent from './display.vue';

export default
{
	id: 'directus-translations-display',
	name: 'Trunslations display',
	description: 'Custom translations display for Directus 9.',
	icon: 'box',
	handler: DisplayComponent,
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	options: [
		/** @todo make this a component so we have dynamic collection for display template component */
		{
			field: 'template',
			name: 'Display template',
			type: 'string',
			meta: {
				interface: 'text-input',
				width: 'full',
			},
		},
	],
};

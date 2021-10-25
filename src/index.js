import Options from './options.vue';
import DisplayComponent from './display.vue';

export default
{
    id: 'directus-translations-display',
    name: 'Trunslations display',
    description: 'Custom translations display for Directus 9.',
    icon: 'box',
    component: DisplayComponent,
    types: ['alias', 'm2m', 'm2o', 'm2a', 'translations'],
	options: Options,
};
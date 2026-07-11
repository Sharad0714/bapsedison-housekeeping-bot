export class InventoryManager {
	constructor (storage) {
		this.storage = storage;
	}

	async getItems () {
		// TODO: Load inventory from storage
		return [];
	}

	async getItem (id) {
		const items = await this.getItems();
		return items.find(item => item.id === id);
	}

	async addItem (item) {
		// TODO
	}

	async updateItem (id, updates) {
		// TODO
	}

	async deleteItem (id) {
		// TODO
	}
}
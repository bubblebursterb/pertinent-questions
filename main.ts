import { App, Editor, MarkdownView, Modal, SuggestModal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, WorkspaceLeaf, Vault } from 'obsidian';
// import { CSVView, VIEW_TYPE_CSV } from "./view";

// Remember to rename these classes and interfaces!

interface PertinentQuestionsSettings {
	questionsFolder: string;
	outputFolder: string;
	contactsFile: string;

}




const DEFAULT_SETTINGS: PertinentQuestionsSettings = {
	questionsFolder: 'Questions/',
	outputFolder: 'Persistent Questions/',
	contactsFile: 'contacts.csv'

}



export default class PertinentQuestions extends Plugin {
	settings: PertinentQuestionsSettings;



	async onload(): Promise<void> {

		await this.loadSettings();




		// Add command to launch Ask Pertinent Questions
		this.addCommand({
			id: 'ask-pertinent-questions',
			name: 'Ask Pertinent Questions',
			callback: async () => {
				const categories: string[] = [];
				this.findAllCategories().forEach(cat => {
					categories.unshift(cat);

				});

				const contacts: string[] = [];

				let allContacts = await this.getAllContacts();

				allContacts.forEach(contact => {
					contacts.unshift(contact);
				});

				// Need to iterate through each contact AND 
				const suggestModal = new PertinentQuestionsSuggestModal(this.app, categories, contacts, this.settings.outputFolder, this.settings.questionsFolder).open();



			}

		});



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PersistentSettingTab(this.app, this));



	}


	async getAllContacts(): Promise<string[]> {
		const files = this.app.vault.getMarkdownFiles();


		let found = false;
		const contacts: string[] = [];

		for (let i = 0; i < files.length; i++) {
			const fileName = files[i].name;

			if (fileName.startsWith(this.settings.contactsFile)) {
				// if (fileName == this.settings.contactsFile) { // EQUALITY == or === does NOT work
				found = true;
				const fileContents: string = await this.app.vault.cachedRead(files[i]);
				const fileLines = fileContents.split("\n");

				for (let j = 0; j < fileLines.length; j++) {
					const contactFields :string[] = fileLines[j].split(",");
					contacts.unshift(contactFields);

				}

			}

		}
		if (!found) {
			console.log(`Didn't find a contacts file`);
			new Notice(`Contacts file not found - expected ${this.settings.contactsFile}`);
		} else {
			return contacts;
		}
		return undefined;

	}

	findAllCategories(): string[] {
		const files = this.app.vault.getMarkdownFiles()
		const categories = [];

		function extractSecondLevelFolder(str): string {
			const regex = /\/([^\/]*)\//;
			const match = str.match(regex);
			return match ? match[1] : null;
		}
		let found = false;
		for (let i = 0; i < files.length; i++) {

			const thePath = files[i].path;
			if (thePath.startsWith(this.settings.questionsFolder)) {
				const substring: string = extractSecondLevelFolder(thePath);
				if (substring) {
					categories.unshift(substring);
					found = true;
				}
			} else {
				// console.log(`Did not match - filepath=${files[i].path}`);
			}
		}
		if (!found) {
			console.log(`Questions folder not found: ${this.settings.questionsFolder}`);
		}
		console.log(`Returning cats = ${categories}`);
		return categories;
	}

	onunload() {
		console.log("Unloading PertinentQuestions plugin...");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class PertinentQuestionsSuggestModal extends SuggestModal<string> {
	categories: string[];
	contacts: string[];
	outputFolder: string;
	questionsFolder: string;
	vault: Vault;

	constructor(app: App, categories: string[], contacts: string[], outputFolder: string, questionsFolder: string) {
		super(app);
		this.vault = app.vault;
		this.categories = categories;
		this.contacts = contacts;
		this.outputFolder = outputFolder;
		this.questionsFolder = questionsFolder;
	}
	// Returns all available suggestions.
	getSuggestions(query: string): string[] {

		return this.categories.filter((cat) =>
			cat.toLowerCase().includes(query.toLowerCase())
		);
	}

	// Renders each suggestion item.
	renderSuggestion(cat: string, el: HTMLElement) {
		el.createEl("div", { text: cat });
		//  el.createEl("small", { text: book.author });
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(cat: string, evt: MouseEvent | KeyboardEvent) {
		// RESEARCH HERE https://www.programcreek.com/typescript/?api=obsidian.FuzzySuggestModal



		const fileContents = [];
		this.createFolder(this.outputFolder);

		// FOREEACH Question Category
		for (let j = 0; j < this.categories.length; j++) {
			console.log(`cat ${j} = ${this.categories[j]}`);
			fileContents.unshift(this.getCategoryQuestions());
			const theFolder = this.outputFolder.concat(this.categories[j]).concat("/");
			this.createFolder(theFolder); // Create the categories
			// FOREACH Email Contact
			for (let i = 0; i < this.contacts.length; i++) {
				console.log(`contact ${i} = ${this.contacts[i]}`)
				// type Contact {
				// 	title: string;
				// 	firstName: string;
				// 	lastName: string;
				// 	emailAddress: string;
				// };

				const [title, firstName, lastName, emailAddress] = this.contacts[i];
				const theSubject = "SUBJECT GOES HERE";
				const theFileMetaData = `---\nsent: false\ncategory: ${this.categories[j]}\n---`;


				const theBody = "BODY GOES HERE";
				// Create Pertinenet Qusetions File using First Name and Last Name
				const theContent = theFileMetaData.concat("```email\n".concat(`to: ${emailAddress}\nsubject: ${theSubject}\nbody: \"${theBody}\"\n`).concat("```").concat("\n#ToSend"));


				// ```email
				// to: kjkjk
				// subject: My Subject1
				// body: \" 
				//  this is the body \"
				// ```'
				this.createFile(theFolder.concat(firstName + lastName + ".md"), theContent);

			}
		}



	}

	async createFile(theFile: string, content: string) {
		try {
			await this.app.vault.create(theFile, content);
			console.log("Created");
		} catch (e) {
			console.log(e);
		}
	}
	async createFolder(theFolder: string) {
		try {
			await this.app.vault.createFolder(theFolder);
			console.log("Created");
		} catch (e) {
			console.log(e);
		}
	}

	getCategoryQuestions(): string[] {
		return ["Q1", "QW"]
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class PersistentSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'General Settings' });

		new Setting(containerEl)
			.setName('Questions Folder')
			.setDesc('Enter the Folder Location')
			.addText(text => text
				.setPlaceholder('Enter Questions Folder')
				.setValue(this.plugin.settings.questionsFolder)
				.onChange(async (value) => {
					console.log('Questions Location: ' + value);
					this.plugin.settings.questionsFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Questions Output Folder')
			.setDesc('Enter the Persistent Questions Output Folder Location')
			.addText(text => text
				.setPlaceholder('Enter Persistent Questions Output Folder')
				.setValue(this.plugin.settings.outputFolder)
				.onChange(async (value) => {
					console.log('Output Folder Location: ' + value);
					this.plugin.settings.outputFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Contacts Import File')
			.setDesc('Enter the Contacts Import File Location')
			.addText(text => text
				.setPlaceholder('Enter Contacts File Location')
				.setValue(this.plugin.settings.contactsFile)
				.onChange(async (value) => {
					console.log('Contacts File Location: ' + value);
					this.plugin.settings.contactsFile = value;
					await this.plugin.saveSettings();
				}));
	}
}


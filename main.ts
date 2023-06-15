import { App, Editor, MarkdownView, Modal, SuggestModal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, WorkspaceLeaf, Vault } from 'obsidian';
import { normalizePath } from "obsidian";
import { AppSettings } from "src/AppSettings";

// import { CSVView, VIEW_TYPE_CSV } from "./view";

// Remember to rename these classes and interfaces!

interface PertinentQuestionsSettings {
	questionsFolder: string;
	outputFolder: string;
	contactsFile: string;


}




const DEFAULT_SETTINGS: PertinentQuestionsSettings = {
	questionsFolder: 'Questions',
	outputFolder: 'Pertinent Questions',
	contactsFile: 'contacts.csv'

}



export default class PertinentQuestions extends Plugin {
	settings: PertinentQuestionsSettings;



	async onload(): Promise<void> {
		await this.loadSettings();

		// Add command to launch Ask Pertinent Questions
		this.addCommand({
			id: 'create-pertinent-questions',
			name: AppSettings.CREATE_PERTINENT_QUESTIONS, 
			callback: async () => {
				const categories: string[] = [];
				this.findAllCategories().forEach(cat => {
					categories.unshift(cat);
				});

				const contacts: string[][] = [];
				let allContacts = await this.getAllContacts(this.settings.contactsFile);
				if (allContacts != null) {
					allContacts.forEach(contact => {
						contacts.unshift(contact);
					});
				}
				// Need to iterate through each contact AND 
				const suggestModal = new PertinentQuestionsSuggestModal(this.app, categories, contacts, this.settings.outputFolder, this.settings.questionsFolder).open();
			}
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PertinentSettingTab(this.app, this));
	}


	async getAllContacts(theContactFile: string): Promise<string[][] | null> {
		const files = this.app.vault.getFiles(); // Can be CSV so need to crawl all files
		let found = false;
		const contacts: string[][] = [];

		for (let i = 0; i < files.length; i++) {
			const fileName = files[i].name;

			if (fileName.startsWith(theContactFile)) {
				// if (fileName == this.settings.contactsFile) { // EQUALITY == or === does NOT work
				found = true;

				const fileContents: string = await this.app.vault.cachedRead(files[i]);
				const fileLines = fileContents.split("\n");

				for (let j = 0; j < fileLines.length; j++) {
					const contactFields: string[] = fileLines[j].split(",");
					contacts.unshift(contactFields);

				}
				i = files.length; //break out as found
			}

		}
		if (!found) {
			console.log(`Didn't find a contacts file`);
			new Notice(`Contacts file not found - expected ${this.settings.contactsFile}`);
		} else {
			return contacts;
		}
		return null;

	}

	findAllCategories(): string[] {
		//  const files = this.app.vault.getMarkdownFiles();
		const categories: string[] = [];

		function extractSecondLevelFolder(str: string): string | null {
			const regex = /\/([^\/]*)\//;
			const match = str.match(regex);

			return match ? match[1] : null;
		}

		const folderOrFile = this.app.vault.getAbstractFileByPath(this.settings.questionsFolder);
		let numFolders = 0;
		if (folderOrFile instanceof TFolder) {
			for (let child of folderOrFile.children) {
				if (child instanceof TFile) {
					// Top level Questions category file
				} else { // Category Folder
					const categoryFolder = this.app.vault.getAbstractFileByPath(child.path)
					console.log(`catFolder = ${categoryFolder} and childPath = ${child.path}************`);
					if (categoryFolder instanceof TFolder) {
						for (let innerChild of categoryFolder.children) {
							if (innerChild instanceof TFile) {
								const substring = extractSecondLevelFolder(innerChild.path);
								console.log(`substring============${substring} from ${innerChild.path}`);
								if (substring != null) {
									if (!categories.contains(substring)) {
										categories.unshift(substring);
									}

								} else {
									console.log(`Couldn't extract folder substring from ${innerChild.path}`);
								}
							}
						}
					}
				}

			}
			console.log(`numFolders=${numFolders}`);
		} else {
			console.log(`NOT AN INSTANCE OF TFolder instead it is ${folderOrFile}`);
		}




		// Markdownfiles parse
		// let found = false;
		// for (let i = 0; i < files.length; i++) {

		// 	const thePath = files[i].path;
		// 	if (thePath.startsWith(this.settings.questionsFolder)) {
		// 		console.log(`thePath ===== ${ thePath }`);
		// 		const substring = extractSecondLevelFolder(thePath);
		// 		if (substring != null) {
		// 			categories.unshift(substring);
		// 			found = true;
		// 		}
		// 	} else {
		// 		// console.log(`Did not match - filepath=${ files[i].path }`);
		// 	}
		// }
		// if (!found) {
		// 	console.log(`Questions folder not found: ${ this.settings.questionsFolder }`);
		// }
		// console.log(`Returning cats = ${ categories }`);
		categories.unshift(AppSettings.ALL_CATEGORIES);
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
	contacts: string[][];
	outputFolder: string;
	questionsFolder: string;
	vault: Vault;


	constructor(app: App, categories: string[], contacts: string[][], outputFolder: string, questionsFolder: string) {
		super(app);
		this.vault = app.vault;
		this.categories = categories;
		this.contacts = contacts;
		this.outputFolder = outputFolder;
		this.questionsFolder = questionsFolder;
	}
	// Returns all available suggestions.
	getSuggestions(query: string): string[] {
		// function compareFunc (a,b){
		// 	if 
		// }
		this.categories.sort(); // sort and ensure ALL_CATEGORIES is first selection
		if (this.categories[0]!=AppSettings.ALL_CATEGORIES){
			const index = this.categories.indexOf(AppSettings.ALL_CATEGORIES);
			this.categories.splice(index,1);
			this.categories.unshift(AppSettings.ALL_CATEGORIES);
		}
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
	async onChooseSuggestion(cat: string, evt: MouseEvent | KeyboardEvent) {
		// RESEARCH HERE https://www.programcreek.com/typescript/?api=obsidian.FuzzySuggestModal

		this.createFolder(this.outputFolder);
		if (cat != AppSettings.ALL_CATEGORIES){
			this.categories = [cat];
		}
		// FOREEACH Question Category
		for (let j = 0; j < this.categories.length; j++) {
			console.log(`cat ${j} = ${this.categories[j]}`);
			// Get all the questions
			let theQuestions = await this.getCategoryQuestions(this.categories[j]);

			if (theQuestions != null) { // No category questions, so don't create a category folder or option
				// need the directory separator 
				const theFolder = this.outputFolder.concat(AppSettings.MAC_FOLDER_SEPARATOR).concat(this.categories[j]);
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
					for (let k = 0; k < theQuestions.length; k++){
						let theQuestion = theQuestions[k];
						const [title, firstName, lastName, emailAddress] = this.contacts[i];
						const theSubject = AppSettings.SUBJECT_GOES_HERE;
						const theFileMetaData = `---\nsent: false\ncategory: ${this.categories[j]}\n---\n\n`;
						const theQuestionFileName: string[] = theQuestion.split("\n", 2);
						const index = theQuestion.indexOf("\n"); // First line is the filename
						if (index != undefined) {
							theQuestion = theQuestion.substring(index, theQuestion.length - 1);
							const theBody = `${AppSettings.FAO} ${title} ${firstName} ${lastName}${theQuestion}`;
							// Create Pertinent Questions File using First Name and Last Name
							const theFileName: string = theFolder.concat("/").concat(firstName + lastName + "-" + theQuestionFileName[0] + ".md");
	
							const fileExists = await this.fileExists(theFileName);
							if (!fileExists) {
								// File does not exist, so create
								console.log(`CREATING FILE *** ${theFileName}`);
								let theFile = await this.createFile(theFileName, theFileMetaData);
								if (theFile instanceof TFile) {
									const theContent: string = ("```email\n".concat(`to: ${emailAddress}\nsubject: ${theSubject}\n\nbody: \"${theBody}\"\n`).concat("```").concat("\n#ToSend"));
									try {
										await this.app.vault.append(theFile, theContent);
									} catch (e) {
										new Notice('Could not append');
										console.log(`Could not append to file: ${theFileName} due to ${e}`);
									}
								}
								else {
									new Notice('Could not create file');
									console.log(`Error - could not create file for ${theFileName}`);
								}
							} else {
								//File exists - ignore
							}
						}
	
					}
		

				} //End FOREACH contact
			} else {
				console.log(`Couldn't read any file at ${this.questionsFolder} `);
			}

		} //End FOREACH category
	}
	protected async fileExists(filePath: string): Promise<boolean> {
		return await this.app.vault.adapter.exists(filePath);
	}

	async createFile(theFilePath: string, content: string): Promise<TFile | null> {
		try {
			const folderOrFile = this.app.vault.getAbstractFileByPath(theFilePath);

			if (folderOrFile instanceof TFile) {
				console.log(`Already created file!!!`);
				return folderOrFile;
			} else if (folderOrFile instanceof TFolder) {
				console.log(`Expected to create file but folder specified: ${theFilePath}`);
			} else {
				// No file or folder so create
				console.log(`Creating File ${theFilePath}`);
				const createdFile: TFile = await this.app.vault.create(theFilePath, content);
				return createdFile;
			}
		} catch (e) {
			console.log(e);
		}
		return null;
	}
	async createFolder(theFolder: string) {
		try {
			await this.app.vault.createFolder(theFolder);
			console.log("Created");
		} catch (e) {
			console.log(e);
		}
	}

	async getCategoryQuestions(category: string): Promise<string [] | null> {

		try {
			// concat the / as all folders need to be devoid of / slashes to work with abstractFilePath impl I have
			const folderOrFile = this.app.vault.getAbstractFileByPath(this.questionsFolder.concat(AppSettings.MAC_FOLDER_SEPARATOR.concat(category)));

			if (folderOrFile instanceof TFolder) {
				const theQuestions : string[] = [];
				for (let child of folderOrFile.children) {
					if (child instanceof TFile) {
						let theQuestionLines = await this.app.vault.cachedRead(child);
						const index = child.path.lastIndexOf(AppSettings.MAC_FOLDER_SEPARATOR);
						if (index != undefined) {
							let theQuestion = child.path + "\n"; // will add to new file name
							// Add 1 to index to go past the / and remove 4 to get rid of the .md
							theQuestion = theQuestion.substring(index + 1, theQuestion.length - 4); // First line of interim file is filename

							const questionLines = theQuestionLines.split("\n");
							const lineStart = AppSettings.EMAIL_NL.concat(AppSettings.EMAIL_SOL);
							for (let i = 0; i < questionLines.length; i++) {
								theQuestion += lineStart.concat(questionLines[i]);
							}
							theQuestions.unshift(theQuestion); 
						}

					}
				}
				return theQuestions;
			} else {
				console.log(`Expected folder in getCategoryQuestions param but sent ${this.questionsFolder.concat(category)}`);
				return null;
			}
		} catch (e) {
			console.log(e);
		}
		return null;



	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class PertinentSettingTab extends PluginSettingTab {
	plugin: PertinentQuestions;

	constructor(app: App, plugin: PertinentQuestions) {
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
			.setDesc('Enter the Pertinent Questions Output Folder Location')
			.addText(text => text
				.setPlaceholder('Enter Pertinent Questions Output Folder')
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


import { App, Editor, MarkdownView, Modal, SuggestModal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, WorkspaceLeaf, Vault } from 'obsidian';
import { normalizePath } from "obsidian";
import { AppSettings as Constants } from "src/Constants";

// import { CSVView, VIEW_TYPE_CSV } from "./view";

// Remember to rename these classes and interfaces!

interface PertinentQuestionsSettings {
	questionsFolder: string;
	outputFolder: string;
	contactsFile: string;


}

type Contact = {
	title: string;
	firstName: string;
	lastName: string;
	emailAddress: string;
};

type QuestionInfo = {
	body: string;
	image: string;
	video: string;
}


const DEFAULT_SETTINGS: PertinentQuestionsSettings = {
	questionsFolder: 'Questions',
	outputFolder: 'Pertinent Questions',
	contactsFile: 'contacts.csv'

}

function uniqByObject(array: Contact[]): Contact[] {
	const result: Contact[] = [];
	let results = 0;
	for (const item of array) {
		let duplicate = false;
		for (let i = 0; i < result.length; i++) {
			if (result[i].emailAddress == item.emailAddress) {
				duplicate = true;
				console.warn(`Duplicate contact found with email address ${item.emailAddress}`);
				break;
			}
			if ((result[i].firstName == item.firstName) && (result[i].lastName == item.lastName)) {
				duplicate = true;
				console.warn(`Duplicate contact found with first and last name ${item.firstName} ${item.lastName}`);
				break;
			}
		}
		if (!duplicate) {
			result.push(item);
		}
	}

	return result;
}
const validateEmail = (email: string) => {
	try {
		return email
			.toLowerCase()
			.match(
				/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			);
	} catch (e) {
		console.error(`ERROR: Problem validating Email with ${email}`);
	}
	return false;
};

function validContact(contact: Contact): boolean {
	let contactIsValid = true;
	if (contact == null || contact == undefined) {
		console.warn("Invalid contact - null or undefined");
		contactIsValid = false;
	} else if (!validateEmail(contact.emailAddress)) {
		console.warn(`Invalid contact - bad email: ${contact.emailAddress}`);
		contactIsValid = false;
	} else if (contact.firstName.length == 0) {
		console.warn(`Invalid contact - no firstname provided`);
		contactIsValid = false;
	} else if (contact.lastName.length == 0) {
		console.warn(`Invalid contact - no lastname provided`);
		contactIsValid = false;
	}

	return contactIsValid;
}

function fileExists(filePath: string, app: App): boolean {
	const folderOrFile = app.vault.getAbstractFileByPath(filePath);
	if (folderOrFile instanceof TFile) {
		return true;
	}
	return false;

}

function folderExists(filePath: string, app: App): boolean {
	const folderOrFile = app.vault.getAbstractFileByPath(filePath);

	if (folderOrFile instanceof TFolder) {
		return true;
	}
	return false;

}

function getShareThis(image: boolean, video: boolean): string {
	//Twitter
	//Telegram
	//Whatsapp
	//Facebook
	//Pinterest
	//Wordpress
	//Tiktok
	return "";
}

export default class PertinentQuestions extends Plugin {
	settings: PertinentQuestionsSettings;



	async onload(): Promise<void> {
		await this.loadSettings();

		// Add command to launch Ask Pertinent Questions
		this.addCommand({
			id: 'create-pertinent-questions',
			name: Constants.CREATE_PERTINENT_QUESTIONS,
			callback: async () => {
				const categories: string[] = [];
				this.findAllCategories().forEach(cat => {
					categories.unshift(cat);
				});

				const contacts: Contact[] = await this.getAllContacts(this.settings.contactsFile);

				const suggestModal = new PertinentQuestionsSuggestModal(this.app, categories, contacts, this.settings.outputFolder, this.settings.questionsFolder).open();
			}
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PertinentSettingTab(this.app, this));
	}



	async getAllContacts(theContactFile: string): Promise<Contact[]> {
		const contacts: Contact[] = [];

		const folderOrFile = this.app.vault.getAbstractFileByPath(theContactFile);

		if (folderOrFile instanceof TFile) {
			let fileContents: string = await this.app.vault.cachedRead(folderOrFile);
			const fileLines = fileContents.split("\n");
			for (let j = 0; j < fileLines.length-1; j++) {

				const [title, firstName, lastName, emailAddress] = fileLines[j].split(",");
				const contact: Contact = { title, firstName, lastName, emailAddress };
				if (contact != null)
					console.debug(`contact = ${contact.title} and ${contact.firstName} and ${contact.lastName} and ${contact.emailAddress}`);
				if (validContact(contact)) {
					contacts.unshift(contact);
				} else {
					console.warn(`Invalid contact found - contact = ${contact}`);
				}

			}
			return uniqByObject(contacts);
		}

		return contacts;
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
					if (categoryFolder instanceof TFolder) {
						for (let innerChild of categoryFolder.children) {
							if (innerChild instanceof TFile) {
								const substring = extractSecondLevelFolder(innerChild.path);
								if (substring != null) {
									console.debug(`DEBUG: substring = ${substring}`);
									if (!categories.contains(substring)) {
										categories.unshift(substring);
									}

								} else {
									console.warn(`Couldn't extract folder substring from ${innerChild.path}`);
								} // endif substring
							} // endif innercHILD
						} //endfor innerchild
					} //endif instanceof TFolder
				} //endif instance of TFile

			}//endfor child of tfolder
			console.debug(`numFolders=${numFolders}`);
		} else {
			console.warn(`NOT AN INSTANCE OF TFolder instead it is ${folderOrFile}`);
		}

		return categories;
	}



	onunload() {
		console.info("Unloading PertinentQuestions plugin...");
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
	contacts: Contact[];
	outputFolder: string;
	questionsFolder: string;
	vault: Vault;


	constructor(app: App, categories: string[], contacts: Contact[], outputFolder: string, questionsFolder: string) {
		super(app);
		this.vault = app.vault;
		this.categories = categories;
		this.contacts = contacts;
		this.outputFolder = outputFolder;
		this.questionsFolder = questionsFolder;
	}
	// Returns all available suggestions.
	getSuggestions(query: string): string[] {
		this.categories.sort(); // sort and ensure ALL_CATEGORIES is first selection
		if (this.categories[0] != Constants.ALL_CATEGORIES) {
			const index = this.categories.indexOf(Constants.ALL_CATEGORIES);
			// this.categories.splice(index, 1);
			this.categories.unshift(Constants.ALL_CATEGORIES);
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

		this.createFolder(this.outputFolder);
		if (cat != Constants.ALL_CATEGORIES) {
			this.categories = [cat];
		} else {
			this.categories.shift(); // remove ALL_CATEGORIES and iterate through ALL categories
		}
		// FOREEACH Question Category
		for (let j = 0; j < this.categories.length; j++) {
			console.debug(`cat ${j} = ${this.categories[j]}`);
			// Get all the questions
			let theQuestions = await this.getCategoryQuestions(this.categories[j]);

			if (theQuestions != null) { // No category questions, so don't create a category folder or option
				// need the directory separator 
				const theFolder = this.outputFolder.concat(Constants.MAC_FOLDER_SEPARATOR).concat(this.categories[j]);
				this.createFolder(theFolder); // Create the categories
				// FOREACH Email Contact
				if (this.contacts.length > 0) {
					for (let i = 0; i < this.contacts.length; i++) {
						for (let k = 0; k < theQuestions.length; k++) {
							let theQuestion = theQuestions[k];
							this.writeQuestionFile(theQuestion, theFolder, this.categories[j], this.contacts.at(i));
						}
					} //End FOREACH contact
				} else {
					for (let k = 0; k < theQuestions.length; k++) {

						let theQuestion = theQuestions[k];
						this.writeQuestionFile(theQuestion, theFolder, this.categories[j]);
					}
				}

			} else {
				console.warn(`Couldn't read any file at ${this.questionsFolder} `);
			}

		} //End FOREACH category
	}

	async writeQuestionFile(theQuestion: QuestionInfo, theFolder: string, category: string, contact?: Contact) {
		const theSubject = Constants.SUBJECT_GOES_HERE;
		const theFileFrontMatter = `---\npublish: true\ntosend: true\nsent: false\ncategory: ${category}\n---\n`;
		const theQuestionFile: string[] = theQuestion.body.split(Constants.EMAIL_NL,2);
		const theQuestionFileName = theQuestionFile[0];
	

		const indexBodyStart = theQuestion.body.indexOf(Constants.EMAIL_NL) + Constants.EMAIL_NL.length; // First line is the filename
		const theQuestionBody = theQuestion.body.substring(indexBodyStart);

		if (indexBodyStart != undefined) {
			let theBody = "";
			let theFileName = "";
			if (contact) {
				theBody = `${Constants.FAO} ${contact.title} ${contact.firstName} ${contact.lastName}` + Constants.EMAIL_NL + `${theQuestionBody}`;
				// Create Pertinent Questions File using First Name and Last Name
				theFileName = theFolder.concat("/").concat(contact.firstName + contact.lastName + "-" + theQuestionFileName + ".md");
			} else {
				theBody = `${Constants.FAO}` + Constants.EMAIL_NL + `${theQuestionBody}`;
				theFileName = theFolder.concat("/").concat(theQuestionFileName) + ".md";
			}
			// File does not exist, so create
			let theFile = await this.createFile(theFileName, theFileFrontMatter);


			if (theFile instanceof TFile) {
				let theContent = "";
				if (contact) {
					theContent = ("```email\n".concat(`to: ${contact.emailAddress}\nsubject: ${theSubject}\nbody: \"${theBody}\"\n`).concat("```"));
				} else {
					// No contact so just generating an eample email
					theContent = ("```email\n".concat(`to: someone@example.com\nsubject: ${theSubject}\nbody: \"${theBody}\"\n`).concat("```"));
				}
				theContent.concat("\n\n").concat(getShareThis(false, false));
				try {
					await this.app.vault.append(theFile, theContent);
				} catch (e) {
					new Notice('Could not append');
					console.error(`Could not append to file: ${theFileName} due to ${e}`);
				}
			}
			else {
				new Notice('Could not create file');
				console.error(`Error - could not create file for ${theFileName}`);
			}

		} // endif index undefined

	}



	async createFile(theFilePath: string, content: string): Promise<TFile | null> {
		try {
			if (!fileExists(theFilePath, this.app)) {
				let createdFile = await this.app.vault.create(theFilePath, content)
				console.debug(`DEBUG:Created File ${theFilePath}`);
				return createdFile;
			}

		} catch (e) {
			console.error(`createFile: filePath: $theFilePath, error: ${e}`);
		}
		return null;
	}
	async createFolder(theFolder: string) {
		try {
			if (!folderExists(theFolder, this.app)) {
				await this.app.vault.createFolder(theFolder);

			}

		} catch (e) {
			console.error(e);
		}
	}

	// getCategoryQuestions adds the file name as the first line/element in the return string
	async getCategoryQuestions(category: string): Promise<QuestionInfo[] | null> {

		try {
			// concat the / as all folders need to be devoid of / slashes to work with abstractFilePath impl I have
			const folderOrFile = this.app.vault.getAbstractFileByPath(this.questionsFolder.concat(Constants.MAC_FOLDER_SEPARATOR.concat(category)));

			if (folderOrFile instanceof TFolder) {
				const theQuestions: QuestionInfo[] = [];
				for (let child of folderOrFile.children) {
					if (child instanceof TFile) {
						let theQuestionLines = await this.app.vault.cachedRead(child);
						const index = child.path.lastIndexOf(Constants.MAC_FOLDER_SEPARATOR); // Folder path / fileName
						if (index != undefined) {
							let theFileFullPath = child.path + "\n"; // Add file name
							const theQuestion: QuestionInfo = { body: "", image: "", video: "" };
							theQuestion.body = theFileFullPath.substring(index + 1, theFileFullPath.length - 4); // First line of interim file is filename

							const questionLines = theQuestionLines.split("\n");
							const lineStart = Constants.EMAIL_NL.concat(Constants.EMAIL_SOL);
							for (let i = 0; i < questionLines.length; i++) {
								if (questionLines[i].contains(Constants.IMAGE_SPECIFIER)) {
									theQuestion.image = questionLines[i];
								} else if (questionLines[i].contains(Constants.VIDEO_SPECIFIER)) {
									theQuestion.video = questionLines[i];
								} else {
									theQuestion.body += lineStart.concat(questionLines[i]);
								}

							} // endfor
							theQuestions.unshift(theQuestion);
						} // endif index 

					}// endif child
				} //endfor child
	
				return theQuestions;
			} else {
				console.warn(`Expected folder in getCategoryQuestions param but sent ${this.questionsFolder.concat(category)}`);
				return null;
			}
		} catch (e) {
			console.error(e);
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
					console.debug('Questions Location: ' + value);
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
					console.debug('Output Folder Location: ' + value);
					this.plugin.settings.outputFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(Constants.CONTACTS_IMPORT_FILE)
			.setDesc('Enter the Contacts Import File Location')
			.addText(text => text
				.setPlaceholder(Constants.CONTACTS_FILE_LOCATION)
				.setValue(this.plugin.settings.contactsFile)
				.onChange(async (value) => {
					this.plugin.settings.contactsFile = value;
					await this.plugin.saveSettings();
				}));
	}
}


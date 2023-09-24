import { App, Editor, MarkdownView, Modal, SuggestModal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, WorkspaceLeaf, Vault } from 'obsidian';
import { normalizePath } from "obsidian";
import { AppSettings as Constants } from "src/Constants";

// import { CSVView, VIEW_TYPE_CSV } from "./view";

// Remember to rename these classes and interfaces!

interface PertinentQuestionsSettings {
	questionsFolder: string;
	questionsOutputFolder: string;
	actionsFolder: string;
	actionsOutputFolder: string;
	contactsFile: string;


}

type Contact = {
	title: string;
	firstName: string;
	lastName: string;
	emailAddress: string;
};

type QorAInfo = {
	body: string;
	image: string;
	video: string;
	tags: string;
	action: string;
	deadline: string;
	qshort: string;
	alias: string;
	mentioned: string;
}






const DEFAULT_SETTINGS: PertinentQuestionsSettings = {
	questionsFolder: 'Questions',
	questionsOutputFolder: 'Pertinent Questions',
	actionsFolder: 'Actions',
	actionsOutputFolder: 'Pertinent Actions',
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



export default class PertinentQuestions extends Plugin {
	settings: PertinentQuestionsSettings;



	async onload(): Promise<void> {
		await this.loadSettings();

		// Add command to launch Ask Pertinent Questions
		this.addCommand({
			id: 'create-pertinent-questions',
			name: Constants.CREATE_PERTINENT_QUESTIONS,
			callback: async () => {
				console.debug(`Adding CREATE Pertinent Questions`);
				const questionCategories: string[] = [];

				this.findAllCategoriesOrActions(true).forEach(cat => {
					questionCategories.unshift(cat);
				});

				const contacts: Contact[] = await this.getAllContacts(this.settings.contactsFile);

				const suggestModal = new PertinentSuggestModal(this.app, true, questionCategories, contacts, this.settings.questionsOutputFolder, this.settings.questionsFolder).open();
			}
		});


		this.addCommand({
			id: 'create-pertinent-actions',
			name: Constants.CREATE_PERTINENT_ACTIONS,
			callback: async () => {
				console.debug(`Adding CREATE Pertinent Actins`);
				const actionCategories: string[] = [];
				this.findAllCategoriesOrActions(false).forEach(cat => {
					actionCategories.unshift(cat);
				});

				const contacts: Contact[] = [];
				const suggestModal = new PertinentSuggestModal(this.app, false, actionCategories, contacts, this.settings.actionsOutputFolder, this.settings.actionsFolder).open();
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
			for (let j = 0; j < fileLines.length - 1; j++) {

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

	findAllCategoriesOrActions(commandQuestion: boolean): string[] {
		//  const files = this.app.vault.getMarkdownFiles();
		const categories: string[] = [];

		function extractSecondLevelFolder(str: string): string | null {
			const regex = /\/([^\/]*)\//;
			const match = str.match(regex);

			return match ? match[1] : null;
		}

		const folderOrFile = commandQuestion ? this.app.vault.getAbstractFileByPath(this.settings.questionsFolder) : this.app.vault.getAbstractFileByPath(this.settings.actionsFolder);
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



class PertinentSuggestModal extends SuggestModal<string> {
	categories: string[];
	contacts: Contact[];
	outputFolder: string;
	questionsOrActionsFolder: string;
	vault: Vault;
	commandQuestion: boolean;


	constructor(app: App, commandQuestion: boolean, categories: string[], contacts: Contact[], outputFolder: string, questionsOrActionsFolder: string) {
		super(app);
		this.vault = app.vault;
		this.commandQuestion = commandQuestion;
		this.categories = categories;
		this.contacts = contacts;
		this.outputFolder = outputFolder;
		this.questionsOrActionsFolder = questionsOrActionsFolder;
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

		this.createFolder(this.outputFolder); // Pertinent Questions or Actions folder
		let theContent = Constants.CONTACTS_HEADER;

		theContent = theContent.concat(Constants.WEF_COMPANIES);
		theContent = theContent.concat(Constants.AUSTRALIA_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.CANADA_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.EU_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.FINLAND_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.GERMANY_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.IRELAND_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.NETHERLANDS_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.NEW_ZEALAND_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.NORWAY_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.SWEDEN_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.SWITZERLAND_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.UK_POLITICAL_CONTACTS);
		theContent = theContent.concat(Constants.US_POLITICAL_CONTACTS);


		this.createFile(Constants.PERTINENT_CONTACTS_FILE, theContent);


		if (cat != Constants.ALL_CATEGORIES) {
			this.categories = [cat];
		} else {
			this.categories.shift(); // remove ALL_CATEGORIES and iterate through ALL categories
		}
		// FOREEACH Question or Action Category
		let totalQuestionOrActionCount = 0;

		theContent = "";
		for (let j = 0; j < this.categories.length; j++) {
			let categoriesCount = 0;
			console.debug(`cat ${j} = ${this.categories[j]}`);
			// Get all the questions
			let theQorAs = await this.getCategoryQuestionsOrActions(this.categories[j]); // theQuestionOrActions


			const theFolder = this.outputFolder.concat(Constants.MAC_FOLDER_SEPARATOR).concat(this.categories[j]);
			if (theQorAs != null) { // No category questions or actions?  
				// need the directory separator 
				this.createFolder(theFolder); // Create the categories
				// FOREACH Email Contact
				categoriesCount = theQorAs.length;
				if (this.contacts.length > 0) {
					for (let i = 0; i < this.contacts.length; i++) {
						for (let k = 0; k < theQorAs.length; k++) {
							let theQorA = theQorAs[k];
							this.commandQuestion ? this.writeQuestionFile(theQorA, theFolder, this.categories[j], this.contacts.at(i)) : this.writeActionFile(theQorA, theFolder, this.categories[j]);
							totalQuestionOrActionCount++;
						}
					} //End FOREACH contact
				} else {
					for (let k = 0; k < theQorAs.length; k++) {
						let theQorA = theQorAs[k];
						this.commandQuestion ? this.writeQuestionFile(theQorA, theFolder, this.categories[j]) : this.writeActionFile(theQorA, theFolder, this.categories[j]);
						totalQuestionOrActionCount++;
					}
				}

			} else {
				console.warn(`Couldn't read any file at ${this.questionsOrActionsFolder} `);
			}

			// Write index files for questions, no need for actions
			// if (this.commandQuestion) {
			// 	const cat = this.categories[j];
			// 	const theFileName = theFolder.concat("/").concat(cat + Constants.CAT_INDEX_SUFFIX);
			// 	theContent = `---\npublish: true\nsent: false\ncategory: ${cat}\n---\n## Instructions\n- [FAQ and Help](https://projectbubbleburst.com/Pertinent+Questions+Help)\n\n- [Support Us](https://projectbubbleburst.com/Support+Us)\n\n## ${cat} Pertinent Questions\n`;
			// 	for (let q = 0; q < categoriesCount; q++) {
			// 		const qPlus = q + 1;
			// 		theContent = theContent.concat("- " + Constants.PBB_ROOT.concat(cat) + `-${qPlus}\n`)
			// 	}
			// 	theContent = theContent.concat(Constants.FOOTER_EMBED);
			// 	theContent = theContent.concat(Constants.EMAIL_NL + Constants.NUM_QUESTIONS + categoriesCount);
			// 	// debugger;
			// 	this.createFile(theFileName, theContent);
			// }

		} //End FOREACH category



		theContent = "";
		theContent = theContent.concat(Constants.FOOTER_EMBED);
//		theContent = theContent.concat(`<div align=center>` + Constants.TOTAL_NUM_QUESTIONS + totalQuestionOrActionCount + `</div>`);
		this.createFile("/Footer.md", theContent);
		new Notice(`${cat} questions/actions created/updated`);


	}

	hasAssignedValue(theValue: string) {
		let itHas: boolean = false;
		if (theValue == null) {
			;
		} else if (theValue == undefined) {
			;
		} else if (theValue.contains('true')) {
			itHas = true;
		}
		return itHas;
	}


	getTags(tags: string) {
		let theTags = "";
		if (tags == null) {
			;
		} else if (tags == undefined) {
			;
		} else if (tags == "") {
			;
		} else {
			try {
				const theTagsArray = tags.split(',');
				theTags = Constants.TAGS_SPECIFIER.concat(" [");
				for (let i = 0; i < theTagsArray.length; i++) {
					if (i != 0) {
						theTags = theTags.concat(",");
					}
					theTags = theTags.concat(theTagsArray[i]);
				}
				theTags = theTags.concat("]");
			} catch (e) {
				console.error(`Uncaught exception getting tags: ${e}`);
			}
		}
		return theTags;
	}
	getDeadline(deadline: string) {
		let theDeadline = "";
		if (deadline == null) {
			;
		} else if (deadline == undefined) {
			;
		} else if (deadline == "") {
			;
		} else {
			try {
				theDeadline = Constants.DEADLINE_SPECIFIER.concat(" ").concat(deadline.replace(/\s/g, ""));
			} catch (e) {
				console.error(`Uncaught exception in getDeadline: ${e}`);
			}

		}
		return theDeadline;
	}
	formatHashtags(theQuestion: QorAInfo): string {
		let theTags = "";
		if (theQuestion.tags.length > 0) {
			const tagsArray = theQuestion.tags.replace(/,/g, ' ').split(' '); // Replace commas with spaces and then split
			let tags = "";
			for (let i = 0; i < tagsArray.length; i++) {
				tags = tags.concat('#').concat(tagsArray[i]).concat(' ');
			}
			theTags = theTags.concat(tags);
		}
		return theTags;
	}
	async writeQuestionFile(theQuestion: QorAInfo, theFolder: string, category: string, contact?: Contact) {
		const hasAnAlias = this.hasAssignedValue(theQuestion.alias);

		let deadline = this.getDeadline(theQuestion.deadline);
		if (deadline != "") {
			deadline = "\n".concat(deadline);
		}

		let tags = this.getTags(theQuestion.tags);
		if (tags != "") {
			tags = "\n".concat(tags);
		}

		let theFileFrontMatter = "";

		if (hasAnAlias) {
			theFileFrontMatter = `---\npublish: true\nsent: false\nalias: ${theQuestion.alias}\ncategory: ${category}${tags}\n---\n`.concat(Constants.INSTRUCTIONS_FAQ_DETAILED);

		} else {
			theFileFrontMatter = `---\npublish: true\nsent: false\ncategory: ${category}${tags}\n---\n`.concat(Constants.INSTRUCTIONS_FAQ_DETAILED);

		}



		const theQuestionFile: string[] = theQuestion.body.split(Constants.EMAIL_NL, 2);
		let theQuestionFileName = "";

		if (theQuestion.qshort != undefined && theQuestion.qshort.length > 0) {
			theQuestionFileName = theQuestion.qshort.trimStart().trimEnd();
		} else {
			theQuestionFileName = theQuestionFile[0];
		}


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
				let re = /"/g;
				const lineStart = Constants.EMAIL_NL.concat(Constants.EMAIL_SOL);
				theBody = theBody.concat(lineStart);
	//			theBody = theBody.concat(`More About ${category}: `).concat(Constants.PBB_PQ_DIR).concat(category).concat(`/${category}-Index`);

				theBody = theBody.replace(re, "%22") // Escape double quote chars
				re = /`/g;
				theBody = theBody.replace(re, "%60") // Escape single quote
				re = /---(\n|.)*?---/g;
				theBody = theBody.replace(re, "") // Remove any front matter kept in error
				re = /\[/g;
				theBody = theBody.replace(re,""); // Remove any wikilinks
				if (contact) {
					theContent = "```email\n".concat(`to: ${contact.emailAddress}\nsubject: ${Constants.SUBJECT_GOES_HERE}\n`);
				} else {
					// No contact so just generating an example email
					theContent = "```email\n".concat(`to: someone@example.com\nsubject: ${Constants.SUBJECT_GOES_HERE}\n`);
				}

				theContent = theContent.concat(`body: \"${theBody}\"\n`).concat("```\n");
				if (theQuestion.mentioned.length > 0) {
					theContent = theContent.concat(Constants.MENTIONED_SPECIFIER).concat(theQuestion.mentioned).concat(`\n`);
				}
				theContent = theContent.concat('> [!NOTE] Note\n>Please see [[Pertinent Contacts|Contacts]] for political representatives and other ideas for who to send information\n## Share It\n');
				//	theContent = theContent.constructTweet(tweet);
				// See https://en.wikipedia.org/wiki/URL_encoding

				let tweet = Constants.TWEET;
				let tweetBody = this.formatHashtags(theQuestion);

				re = / /g;
				tweetBody = tweetBody.concat(Constants.PBB_PQ_DIR).concat(theQuestionFileName.replace(re, '+'));
				tweet = tweet.concat(encodeURIComponent(tweetBody)).concat(')\n');
				theContent = theContent.concat(tweet);

				let fb = Constants.FACEBOOK_POST;
				let fbBody = this.formatHashtags(theQuestion);

				fbBody = fbBody.concat(Constants.PBB_PQ_DIR).concat(theQuestionFileName.replace(re, '+'));
				fb = fb.concat(encodeURIComponent(fbBody)).concat(')\n\n');
				theContent = theContent.concat(fb);


				theContent = theContent.concat(Constants.RESEARCH_MEDIA_HEADING);
				theContent = theContent.concat(Constants.IMAGE_MEDIA_HEADING)
				if (theQuestion.image.length > 0) {
					theContent = theContent.concat(Constants.EMAIL_NL).concat(theQuestion.image);
				}
				theContent = theContent.concat(Constants.VIDEO_HEADING);
				if (theQuestion.video.length > 0) {
					// theContent = theContent.concat(Constants.VIDEO_EMBED1).concat(theQuestion.video).concat(Constants.VIDEO_EMBED2);
					theContent = theContent.concat(theQuestion.video);
				}

				theContent = theContent.concat(Constants.EMAIL_NL).concat(Constants.FOOTER_SPECIFIER);

				try {
					await this.app.vault.append(theFile, theContent);
				} catch (e) {
					console.error(`Could not append to file: ${theFileName} due to ${e}`);
				}
			}
			else {
				console.error(`Error - could not create file for ${theFileName}`);
			}
		} // endif index undefined
	}


	async writeActionFile(theAction: QorAInfo, theFolder: string, category: string, contact?: Contact) {
		const hasAnAlias = this.hasAssignedValue(theAction.alias);

		let deadline = this.getDeadline(theAction.deadline);
		if (deadline != "") {
			deadline = "\n".concat(deadline);
		}

		let tags = this.getTags(theAction.tags);
		if (tags != "") {
			tags = "\n".concat(tags);
		}

		let theFileFrontMatter = "";

		if (hasAnAlias) {
			theFileFrontMatter = `---\npublish: true\nsent: false\nalias: ${theAction.alias}\ncategory: ${category}\naction: true\n${deadline}${tags}\n---\n`.concat(Constants.INSTRUCTIONS_FAQ);

		} else {
			theFileFrontMatter = `---\npublish: true\nsent: false\ncategory: ${category}\naction: true\n${deadline}${tags}\n---\n`.concat(Constants.INSTRUCTIONS_FAQ);

		}


		const theActionFile: string[] = theAction.body.split(Constants.EMAIL_NL, 2);
		let theActionFileName = "";

		if (theAction.qshort != undefined && theAction.qshort.length > 0) {
			theActionFileName = theAction.qshort.trimStart().trimEnd();
		} else {
			theActionFileName = theActionFile[0];
		}


		const indexBodyStart = theAction.body.indexOf(Constants.EMAIL_NL) + Constants.EMAIL_NL.length; // First line is the filename
		const theQuestionBody = theAction.body.substring(indexBodyStart);

		if (indexBodyStart != undefined) {
			let theBody = "";
			let theFileName = "";

			theBody = theQuestionBody;
			theFileName = theFolder.concat("/").concat(theActionFileName) + ".md";


			// File does not exist, so create
			let theFile = await this.createFile(theFileName, theFileFrontMatter);


			if (theFile instanceof TFile) {
				let theContent = "";
				let re = /"/g;
				const lineStart = Constants.EMAIL_NL.concat(Constants.EMAIL_SOL);
				theBody = theBody.concat(lineStart);
//				theBody = theBody.concat(`More About ${category}: `).concat(Constants.PBB_PQ_DIR).concat(category).concat(`/${category}-Index`);


				re = /---(\n|.)*?---/g;
				theBody = theBody.replace(re, "") // Remove any front matter kept in error


				theContent = theContent.concat(theBody + "\n");
				if (theAction.mentioned.length > 0) {
					theContent = theContent.concat(Constants.MENTIONED_SPECIFIER).concat(theAction.mentioned).concat(`\n`);
				}
				theContent = theContent.concat('> [!NOTE] ' + Constants.PERTINENT_CONTACTS_REFERENCE);
				//	theContent = theContent.constructTweet(tweet);
				// See https://en.wikipedia.org/wiki/URL_encoding

				let tweet = Constants.TWEET;
				let tweetBody = this.formatHashtags(theAction);

				re = / /g;
				tweetBody = tweetBody.concat(Constants.PBB_PQ_DIR).concat(theActionFileName.replace(re, '+'));
				tweet = tweet.concat(encodeURIComponent(tweetBody)).concat(')\n');
				theContent = theContent.concat(tweet);

				let fb = Constants.FACEBOOK_POST;
				let fbBody = this.formatHashtags(theAction);

				fbBody = fbBody.concat(Constants.PBB_PQ_DIR).concat(theActionFileName.replace(re, '+'));
				fb = fb.concat(encodeURIComponent(fbBody)).concat(')\n\n');
				theContent = theContent.concat(fb);


				theContent = theContent.concat(Constants.RESEARCH_MEDIA_HEADING);
				theContent = theContent.concat(Constants.IMAGE_MEDIA_HEADING)
				if (theAction.image.length > 0) {
					theContent = theContent.concat(Constants.EMAIL_NL).concat(theAction.image);
				}
				theContent = theContent.concat(Constants.VIDEO_HEADING);
				if (theAction.video.length > 0) {
					// theContent = theContent.concat(Constants.VIDEO_EMBED1).concat(theQuestion.video).concat(Constants.VIDEO_EMBED2);
					theContent = theContent.concat(theAction.video);
				}

				theContent = theContent.concat(Constants.EMAIL_NL).concat(Constants.FOOTER_SPECIFIER);

				try {
					await this.app.vault.append(theFile, theContent);
				} catch (e) {
					console.error(`Could not append to file: ${theFileName} due to ${e}`);
				}
			}
			else {
				console.error(`Error - could not create file for ${theFileName}`);
			}
		} // endif index undefined
	}
	// function constructTweet(str: string): string | null {
	// 	const regex = /\/([^\/]*)\//;
	// 	const match = str.match(regex);

	// 	return match ? match[1] : null;
	// }

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
	async getCategoryQuestionsOrActions(category: string): Promise<QorAInfo[] | null> {

		try {
			// concat the / as all folders need to be devoid of / slashes to work with abstractFilePath impl I have
			const folderOrFile = this.app.vault.getAbstractFileByPath(this.questionsOrActionsFolder.concat(Constants.MAC_FOLDER_SEPARATOR.concat(category)));

			if (folderOrFile instanceof TFolder) {
				const theQuestions: QorAInfo[] = [];
				for (let child of folderOrFile.children) {
					if (child instanceof TFile) {
						if (child.extension.endsWith("md")) {
							let theQuestionLines = await this.app.vault.cachedRead(child);
							const index = child.path.lastIndexOf(Constants.MAC_FOLDER_SEPARATOR); // Folder path / fileName
							if (index != undefined) {
								let theFileFullPath = child.path + "\n"; // Add file name
								const theQuestion: QorAInfo = { body: "", image: "", video: "", tags: "", action: "", deadline: "", alias: "", qshort: "", mentioned: "" };
								theQuestion.body = theFileFullPath.substring(index + 1, theFileFullPath.length - 4); // First line of interim file is filename

								const questionLines = theQuestionLines.split("\n");
								const lineStart = Constants.EMAIL_NL.concat(Constants.EMAIL_SOL);
								for (let i = 0; i < questionLines.length; i++) {

									if (questionLines[i].contains(Constants.IMAGE_SPECIFIER)) {
										theQuestion.image = questionLines[i].split(Constants.IMAGE_SPECIFIER)[1];
									} else if (questionLines[i].contains(Constants.VIDEO_SPECIFIER)) {
										theQuestion.video = questionLines[i].split(Constants.VIDEO_SPECIFIER)[1];

									} else if (questionLines[i].contains(Constants.TAGS_SPECIFIER)) {
										theQuestion.tags = questionLines[i].split(Constants.TAGS_SPECIFIER)[1];
									} else if (questionLines[i].contains(Constants.CAMPAIGN_SPECIFIER)) {
										theQuestion.action = questionLines[i].split(Constants.CAMPAIGN_SPECIFIER)[1];
									} else if (questionLines[i].contains(Constants.DEADLINE_SPECIFIER)) {
										theQuestion.deadline = questionLines[i].split(Constants.DEADLINE_SPECIFIER)[1];
									} else if (questionLines[i].contains(Constants.ALIAS_SPECIFIER)) {
										theQuestion.alias = questionLines[i].split(Constants.ALIAS_SPECIFIER)[1];
									} else if (questionLines[i].contains(Constants.QSHORT_SPECIFIER)) {
										theQuestion.qshort = questionLines[i].split(Constants.QSHORT_SPECIFIER)[1];
									} else if (questionLines[i].contains(Constants.MENTIONED_SPECIFIER)) {
										theQuestion.mentioned = questionLines[i].split(Constants.MENTIONED_SPECIFIER)[1];
									} else if (questionLines[i].contains(Constants.FOOTER_SPECIFIER)) {
										; // Filter it out, it will be added to the PQ page
									} else {
										theQuestion.body += lineStart.concat(questionLines[i]);
									}

								} // endfor
								theQuestions.unshift(theQuestion);
							} // endif index 
						}// endif md
					}// endif child
				} //endfor child

				return theQuestions;
			} else {
				console.warn(`Expected folder in getCategoryQuestions param but sent ${this.questionsOrActionsFolder.concat(category)}`);
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
			.setName('Questions Input Folder')
			.setDesc('Enter the Folder Location')
			.addText(text => text
				.setPlaceholder('Enter Questions Input Folder')
				.setValue(this.plugin.settings.questionsFolder)
				.onChange(async (value) => {
					console.debug('Questions Location: ' + value);
					this.plugin.settings.questionsFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Actions Input Folder')
			.setDesc('Enter the Folder Location')
			.addText(text => text
				.setPlaceholder('Enter Actions Folder')
				.setValue(this.plugin.settings.actionsFolder)
				.onChange(async (value) => {
					console.debug('Actions Location: ' + value);
					this.plugin.settings.actionsFolder = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Questions Output Folder')
			.setDesc('Enter the Pertinent Questions Output Folder Location')
			.addText(text => text
				.setPlaceholder('Enter Pertinent Questions Output Folder')
				.setValue(this.plugin.settings.questionsOutputFolder)
				.onChange(async (value) => {
					console.debug('Output Folder Location: ' + value);
					this.plugin.settings.questionsOutputFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Actions Output Folder')
			.setDesc('Enter the Pertinent Actions Output Folder Location')
			.addText(text => text
				.setPlaceholder('Enter Pertinent Actions Output Folder')
				.setValue(this.plugin.settings.actionsOutputFolder)
				.onChange(async (value) => {
					console.debug('Output Folder Location: ' + value);
					this.plugin.settings.actionsOutputFolder = value;
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


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
	tags: string;
	campaign: string;
	deadline: string;
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

// function getShareThis(image: boolean, video: boolean): string {
// 	//Twitter
// 	//Telegram
// 	//Whatsapp
// 	//Facebook
// 	//Pinterest
// 	//Wordpress
// 	//Tiktok
// 	if (image){

// 	}
// 	if {video}{

// 	}
// 	return "";
// }

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

		this.createFolder(this.outputFolder); // Pertinent Questions folder
		let theContent = '\n\n## Contacts\n> [!NOTE]\n>**Remember - send the questions to your friends, family, colleagues and local businesses first and foremost to avoid central censorship.**\n>\n> *To pose a pertinent question, the question must first be unapposed.*\n\nBelow is a short list of some country political representatives and WEF aligned companies. For further information, see: https://en.wikipedia.org/wiki/List_of_legislatures_by_country';
		
		theContent = theContent.concat('\n\n### Global\n- WEF Companies - https://www.weforum.org/partners#search [Let them know where your money will not be spent](https://projectbubbleburst.com/Actions/Action+18+-+Let+them+know+-+FTheWEF)');
		theContent = theContent.concat('\n### Australia\n- List Senators and Members: https://www.aph.gov.au/Senators_and_Members/Parliamentarian_Search_Results?q=&mem=1&par=-1&gen=0&ps=0');
		theContent = theContent.concat('\n### Canada\n- List of MPs: https://www.ourcommons.ca/members/en/search');
		theContent = theContent.concat('\n### EU\n- List of MEPs: https://www.europarl.europa.eu/meps/en/full-list/all');
		theContent = theContent.concat('\n### Finland\n- List of MPs: https://www.eduskunta.fi/EN/kansanedustajat/nykyiset_kansanedustajat/Pages/default.aspx');
		theContent = theContent.concat('\n### Germany\n- List of MPs: https://www.bundestag.de/en/members');
		theContent = theContent.concat('\n### Ireland\n- List of TDs and Senators: https://www.oireachtas.ie/en/members/');
		theContent = theContent.concat('\n### Netherlands\n- List of MPs: https://www.houseofrepresentatives.nl/members_of_parliament/members_of_parliament');
		theContent = theContent.concat('\n### New Zealand\n- List of MPs: https://www.parliament.nz/en/mps-and-electorates/members-of-parliament/');
		theContent = theContent.concat('\n### Norway\n- List of MPs: https://www.stortinget.no/en/In-English/Members-of-the-Storting/current-members-of-parliament/');
		theContent = theContent.concat('\n### Sweden\n- List of MPs: https://www.riksdagen.se/en/Members-and-parties/');
		theContent = theContent.concat('\n### Switzerland\n- List of MPs: https://www.parlament.ch/en/organe/national-council/members-national-council-a-z');
		theContent = theContent.concat('\n### UK\n- Spreadsheet list of MPs: https://www.theyworkforyou.com/mps/?f=csv\n- Find your MP: https://members.parliament.uk/members/commons\n- Find a Lord: https://members.parliament.uk/members/lords');
		theContent = theContent.concat('\n### US\n- List of Senators: https://www.senate.gov/senators/');
		
		this.createFile("/Pertinent Contacts.md",theContent);
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

	isACampaign(campaign: string){
		let itIs :boolean = false;
		if (campaign == null){
			;
		}else if (campaign == undefined){
			;
		}else if (campaign.contains('true')){
			itIs = true;
		}
		return itIs;
	}
	getTags(tags: string){
		let theTags = "";
		if (tags == null){
			;
		} else if (tags == undefined){
			;
		} else if (tags == ""){
			;
		} else{
			try{
				const theTagsArray = tags.split(',');
				theTags = Constants.TAGS_SPECIFIER.concat(" [");
				for (let i = 0; i < theTagsArray.length; i++) {
					if (i!=0){
						theTags = theTags.concat(",");
					}
					theTags = theTags.concat(theTagsArray[i]);
				}
				theTags = theTags.concat("]");
			}catch (e){
				console.error(`Uncaught exception getting tags: ${e}`);
			}
		}
		return theTags;
	}
	getDeadline(deadline: string){
		let theDeadline = "";
		if (deadline == null){
			;
		} else if (deadline == undefined){
			;
		} else if (deadline == ""){
			;
		} else {
			try{
				theDeadline = Constants.DEADLINE_SPECIFIER.concat(" ").concat(deadline.replace(/\s/g, ""));
			}catch (e){
				console.error(`Uncaught exception in getDeadline: ${e}`);
			}

		}
		return theDeadline;
	}
	formatHashtags(theQuestion: QuestionInfo): string{
		let theTags = "";
		if (theQuestion.tags.length > 0){
			const tagsArray = theQuestion.tags.replace(/,/g,' ').split(' '); // Replace commas with spaces and then split
			let tags = "";
			for (let i = 0; i < tagsArray.length; i++){
				tags = tags.concat('#').concat(tagsArray[i]).concat(' ');
			}
			theTags = theTags.concat(tags);
		}
		return theTags;
	}
	async writeQuestionFile(theQuestion: QuestionInfo, theFolder: string, category: string, contact?: Contact) {
		const theSubject = Constants.SUBJECT_GOES_HERE;
		const aCampaign = this.isACampaign(theQuestion.campaign);
		let deadline = this.getDeadline(theQuestion.deadline);
		if (deadline != ""){
			deadline = "\n".concat(deadline);
		}

		let tags = this.getTags(theQuestion.tags);
		if (tags != ""){
			tags = "\n".concat(tags);
		}		
	
		const theFileFrontMatter =	`---\npublish: true\ntosend: true\nsent: false\ncategory: ${category}\ncampaign: ${aCampaign}${deadline}${tags}\n---\n## Instructions\n[FAQ and Help](https://projectbubbleburst.com/Pertinent+Questions+Help)\n\n- reSearch - The content and reSearch Media. Make sure you personalise your email with your own reasoned arguments and feelings.\n- Send It!\n- Share It!\n- [Support Us](https://projectbubbleburst.com/Support+Us)\n\n## Send It\nPersonalise the message below\n`;
		
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
				let re = /"/g;
				theBody = theBody.replace(re,"%22") // Escape double quote chars
				re = /`/g;
				theBody = theBody.replace(re,"%60") // Escape double quote
				re = /---(\n|.)*?---/g;
				theBody = theBody.replace(re,"") // Remove any front matter kept in erro
				if (contact) {
					theContent = ("```email\n".concat(`to: ${contact.emailAddress}\nsubject: ${theSubject}\nbody: \"${theBody}\"\n`).concat("```"));
				} else {
					// No contact so just generating an eample email
					theContent = ("```email\n".concat(`to: someone@example.com\nsubject: ${theSubject}\nbody: \"${theBody}\"\n`).concat("```"));
				}
				theContent = theContent.concat(Constants.EMAIL_NL).concat('\n> [!NOTE] Note\n>Please see [[Pertinent Contacts|Contacts]] for political representatives and other ideas for who to send information\n## Share It\n');
			//	theContent = theContent.constructTweet(tweet);
				// See https://en.wikipedia.org/wiki/URL_encoding

				let tweet = '[Twitter](https://twitter.com/intent/tweet?text=';
				let tweetBody = this.formatHashtags(theQuestion);

				re = / /g;
				tweetBody = tweetBody.concat(Constants.PBB_PQ_DIR).concat(theQuestionFileName.replace(re,'+'));
				tweet = tweet.concat(encodeURIComponent(tweetBody)).concat(')\n');
				theContent = theContent.concat(tweet);
		
				let fb = '[Facebook](https://www.facebook.com/sharer.php?u=';
				let fbBody = this.formatHashtags(theQuestion);

				fbBody = fbBody.concat(Constants.PBB_PQ_DIR).concat(theQuestionFileName.replace(re,'+'));
				fb = fb.concat(encodeURIComponent(fbBody)).concat(')\n\n');
				theContent = theContent.concat(fb);
				
			
				theContent = theContent.concat('## reSearch Media\n### Image\n');
				if (theQuestion.image.length > 0){
					theContent = theContent.concat(Constants.EMAIL_NL).concat(theQuestion.image);
				} 
				theContent = theContent.concat('\n### Video\n');
				if (theQuestion.video.length > 0){
					theContent = theContent.concat(Constants.VIDEO_EMBED1).concat(theQuestion.video).concat(Constants.VIDEO_EMBED2);
				}


			
			
				
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
	async getCategoryQuestions(category: string): Promise<QuestionInfo[] | null> {

		try {
			// concat the / as all folders need to be devoid of / slashes to work with abstractFilePath impl I have
			const folderOrFile = this.app.vault.getAbstractFileByPath(this.questionsFolder.concat(Constants.MAC_FOLDER_SEPARATOR.concat(category)));

			if (folderOrFile instanceof TFolder) {
				const theQuestions: QuestionInfo[] = [];
				for (let child of folderOrFile.children) {
					if (child instanceof TFile) {
						if (child.extension.endsWith("md")){
						let theQuestionLines = await this.app.vault.cachedRead(child);
						const index = child.path.lastIndexOf(Constants.MAC_FOLDER_SEPARATOR); // Folder path / fileName
						if (index != undefined) {
							let theFileFullPath = child.path + "\n"; // Add file name
							const theQuestion: QuestionInfo = { body: "", image: "", video: "", tags: "", campaign: "", deadline: "" };
							theQuestion.body = theFileFullPath.substring(index + 1, theFileFullPath.length - 4); // First line of interim file is filename

							const questionLines = theQuestionLines.split("\n");
							const lineStart = Constants.EMAIL_NL.concat(Constants.EMAIL_SOL);
							for (let i = 0; i < questionLines.length; i++) {
					
								if (questionLines[i].contains(Constants.IMAGE_SPECIFIER)) {
									theQuestion.image = questionLines[i].split(Constants.IMAGE_SPECIFIER)[1];
								} else if (questionLines[i].contains(Constants.VIDEO_SPECIFIER)) {
									theQuestion.video = questionLines[i].split(Constants.VIDEO_SPECIFIER)[1];
								
								} else if (questionLines[i].contains(Constants.TAGS_SPECIFIER)){
									theQuestion.tags = questionLines[i].split(Constants.TAGS_SPECIFIER)[1];
								}else if (questionLines[i].contains(Constants.CAMPAIGN_SPECIFIER)){
									theQuestion.campaign = questionLines[i].split(Constants.CAMPAIGN_SPECIFIER)[1];
								}else if (questionLines[i].contains(Constants.DEADLINE_SPECIFIER)){
									theQuestion.deadline = questionLines[i].split(Constants.DEADLINE_SPECIFIER)[1];
								}else {
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


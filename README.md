# Pertinent Questions Plugin

## How to use

### Video tutorials here
- Coming Soon



## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.


## Support URL
- https://ProjectBubbleBurst.com/Support+Us


## Initial Setup 
- Download and install Obsidian:  https://obsidian.md/download - it will detect your operating system and provide you the right installer. You can see it has recognised my Mac here for example
- Download and install the Pertinent Questions Plugin: https://github.com/bubblebursterb/pertinent-questions (Note: Tthe plugin will be submitted to [The Obsidian Plugins Repository](https://obsidian.md/plugins) - so should be accessible from within the Obsidian Application itself.)
- Download the latest tranche of Pertinent Questions (available from the ProjectBubbleBurst substack https://projectbubbleburst.substack.com/)

## Plugin Installation
### .. automatically in Obsidian
The Pertinent Question Plugin has a dependency on 2 other plugins to work:
1. Email Block by JoLeaf - https://github.com/joleaf/obsidian-email-block-plugin
2. Projects by Marcus Olsson - https://github.com/marcusolsson/obsidian-projects

For the Email Block plugin
1. Go to **Community Plugins** in your Obsidian Settings and **disable** Safe Mode
2. Click on **Browse** and search for "Email Block"
3. Click install
4. Toggle the plugin on in the **Community Plugins** tab

For the Projects plugin
1. Go to **Community Plugins** in your Obsidian Settings 
2. Click on **Browse** and search for "Projects"
3. Click install
4. Toggle the plugin on in the **Community Plugins** tab

When the Pertinent Questions plugin has been accepted into the Obsidian Plugin repository
1. Go to **Community Plugins** in your Obsidian Settings
2. Click on **Browse** and search for "Pertinent Questions"
3. Click install
4. Toggle the plugin on in the **Community Plugins** tab

Until then, install manually from GitHub below:

### [.. manually from the GitHub repo](https://github.com/bubblebursterb/pertinent-questions/releases)

1. Download the latest [release](https://github.com/bubblebursterb/pertinent-questions/releases) `*.zip` file.
2. Unpack the zip in the `.obsidan/plugins` folder of your obsidian vault


## Pertinent Questions Plugin Configuration

- Visual launch of Obsidian settings - see settings icon bottom left hand corner of screen.
- Hotkey launch of Obsidian settings:

Windows | Mac
---|---
CTRL , | CMD ,

 A quick note on the appearance of Obsidian, out of the box, it can be configured in a myriad of ways, you don't need to do anything but if you want to spruce things up, take a look at the Appearance section to maybe change the accent colour for example.

CTRL , in Windows, CMD , in Mac, then click on Pertinent Questions 
- You can specify where the Questions Folder - which will be provided as a zip file to you - , the output folder and contacts files are expected within the vault.
> [!Note] NB1
> In order to see the contacts.csv file in your vault, you need to launch the Obsidian Settings, go to File & Links and enable the "Detect all file extensions" option
> 
> The contacts.csv file has the following comma separated format:
> Title, First name, Last name, Email Address
> 
> If you wish to export contacts from Gmail/Outlook to CSV files, you will need to edit the export file and remove the unwanted columns
> 
> If you wish to just generate the questions so you can fill in an email address yourself, either rename the contacts.csv file (so it is not found) or just delete the file from the Contacts Import File setting.




## Pertinent Questions -  Questions Generation
The Obsidian Command Pallet is used to execute any/all commands. These commands can also be configured from the Settings menu with Hotkeys but to launch the command pallet, the standard hotkey is:

Windows | Mac
---|---
CTRL P | CMD P

- Start typing PERT and you'll see a dynamic list 
- Select Pertinent Questions: Create Pertinent Questions
- Choose a single Category or All Categories:
 - The questions will be generated in the output folder e.g. Pertinent Questions. The output folder is entirely up to you/your own naming system scheme.

## Projects Plugin Utilisation
### Overview 
This plugin allows the questions to be visualised and tracked from a workflow perspective.
- The columns can be filtered and sorted and hidden.
- So for example, you could filter all questions to a particular person or a particular set questions in a category for example.
> [!Note] Projects Plugin Limits
> By default, the Projects plugin is configured to handle 1000 notes (i.e. Pertinent Questions). It can be increased but there are performance implications and the plugin may have issues. 
> 
> The number of items generated is a function of how many questions there are in the vault (total displayed at the bottom of each generated question) TIMES the number of contacts in the csv file.
> 
> So - you can get around this by having multiple output folders with smaller numbers of questions OR filtering within a Project Vault OR  create a filtered Project Vault using tags to filter a large question set
### Column Explanations
- name - This is the filename within the vault. It is an amalgam of the contact to send to and the original filename in the Questions input folder. Click on to see the actual file
- path - Shows where the output file is in the vault (use the Filter option to filter out if you wish)
- alias - Alias for the question - published to ProjectBubbleBurst.com
- campaign - A Boolean column - true if the 'question' is a campaign and false if it is a normal Pertinent Question
- category - All questions/campaigns have a primary category where they were initially created
- deadline - Used in conjunction with campaigns (if the campaign has a deadline)
- publish - Administration column - ignore/filter out
- sent - Use this to track if you have sent the pertinent question to a specific individual. This is the main workflow tracking element and can be used with filters to show what is left to process in the backlog
- tags - Another way to slice and dice the questions so you can find "Pertinent Questions" which span more than a primary category, the Projects plugin does not allow navigation of the tags sadly but you can find tags using the right hand side sidebar (with the tag icon denoted by # icon - see below or you can search for tags using CTRL Shift F or CMD Shift F and specify the tag like so: #Tranche1, #Global, #Facemask etc...)

### Show Project
Windows | Mac
---|---
CTRL P | CMD P

- Start typing Project and you'll see a dynamic list
- Select Projects: Show Projects
- This will open the Projects window - the main window you can use to track your workflow.
- Take a look at the "Demo Project"

### Pin Project
Obsidian allows you to pin a note/file so it cannot be closed. This can be done via an ellipsis (3 dots) using the mouse for a given file or from the Command Pallet:


Windows | Mac
---|---
CTRL P | CMD P

- Start typing pin and you'll see a dynamic list 
- Select Toggle pin - the Project note/file will now have a pin icon


## Pertinent Question Workflow
### Create Pertinent Questions
Now we create the pertinent questions - launch the Command Palette:


Windows | Mac
---|---
CTRL P | CMD P

- Start typing "pert"
- Hit Enter to Create Pertinent Questions
- Select All Categories (if you wish to generated all questions)
- The Pertinent Questions folder houses all the newly generated "Pertinent Questions". The Footer and Pertinent Contacts files are used by/included within the questions.
- Follow the instructions once more to [[Beta Quick Start Guide#Show Project|Show Project]] and continue with the instructions below.

### Full Screen Mode

Windows | Mac
---|---
CTRL P | CMD P

- Start typing sidebar and you'll see a dynamic list 
- Selecting each option will open/close the right or left sidebars - you can also do this with your mouse in the top left and right hand sides of the screen.
- When you have the full screen showing we will split the screen in 2 so on one side you will have the Projects note/file showing your workflow information and on the other side we will have each of the Pertinent Questions / Campaign notes open as we process them (i.e. Send off an email, Tweet/Send to Facebook). 

### Split Screen
You can split the screen horizontally or vertically depending upon your preference. I recommend splitting vertically as you can see more in portrait mode

Windows | Mac
---|---
CTRL P | CMD P

- Start typing split and you'll see a dynamic list
- Choose Split right for vertical splitting as mentioned.
- Your screen is now split vertically
- Click on one of the filenames in the left hand side (i.e. the Pinned Projects note/file) - this will automatically open the "Pertinent Question"/Campaign note in the right hand side window
> [!Note] **NB**
> You may witness the Projects pane go blank at this point, if it does, select the Demo Project from the dropdown and then select the "Pertinent Questions" project once more - it appears to be a small bug 

### Hide Dashboard Columns
- Hide columns you do not wish to see by clicking on the Hide fields dropdown
- I recommend you hide the path, alias and publish fields. They are not needed to use the plugin. The only fields you really need are name and sent fields

### Pertinent Question File Sections - Explanation

> [!NOTE] Reading View information
> Before looking at the structure, take a moment to familiarise yourself with the reading/edit mode look and feel


Windows | Mac
---|---
CTRL E | CMD E

- Start typing read and you'll see a dynamic list 
- You will see the note in either an edit mode or a reading mode. You can also toggle reading view by clicking on the Book icon/Pencil icon in the note itself.
- In Reading view - you cannot see the metadata 
- If you want to see the metadata (which is useful to see how items are updated in real time), toggle the reading view 

#### Instructions section
This section contains a link to the FAQ and Help page - which will be constructed after the plugin has gone through Beta testing and feedback incorporated.

##### reSearch 
As it says, research the information in the note to ensure you are happy with the content and veracity. 

Don't take my word for it. 

Also, and most importantly, personalise the email/content - it will get a much better response and evade any bulk filters (in the event you are sending to a 'central  figurehead' such as an MP)

##### Send It!
This is the email you can send, more on this below.

##### Share It!
A couple of options for sharing on Social Media - still useful to do but not as powerful as email and sending information to your peers.

##### Support Us
A call to action to join the free ProjectBubbleBurst substack. This is where updates to the plugin as well as new stacks related to the sovereign movement will be published.

2 stacks in the works for publication to launch the plugin public release:
- "The Time for Pertinent Questions" - This will be the launch stack for this plugin.  See the rationale for this portmanteau here: [Twaininformation Definition](https://projectbubbleburst.com/Points+of+Interest/Twainformation)
- "A Confluence of Philanthropaths" - A series of stacks explaining why the world is the way it is...

### Send Your Question
This is the whole raison d'etre of the plugin - sending "Pertinent Questions" to friends, family, colleagues, local businesses etc... in the first instance. I have included 2 options for sending to social media as well but the main focus of the plugin is to send emails to 'peers' simply because:
1. Emails have a better visibility/shelf than a social media post and crucially
2. They are not as easily censored 

> [!Note] **Pre-requisite**
> You need to have your email client open (be it Gmail, Outlook, Thunderbird etc...)
- Click on the Mailto link. This will launch your email client. You need to personalise the Subject line and ideally the body of the message itself too. The sections further down in reSearch Media may also have images/videos for reference and/or attachment to the email itself.

### Share It!
This section allows you to send a Tweet or Facebook message.

### reSearch Media
Optional extra resources such as images and/or video

### Footer
Subscription call to action for the ProjectBubbleBurst stack. The end of the footer also shows how many questions in total there are currently in the Pertinent Questions vault.

## How To Filter Projects - #Together Example
Questions tagged #Together are related to [Together Declaration Campaigns](https://togetherdeclaration.org/)

Show the Projects dashboard as per previous instructions.

- Click the ellipsis and choose Duplication Project
- Click the ellipsis once more and choose Edit Project for Pertinent Questions Copy
- Click Edit Project
- Rename Pertinent Questions Copy to Together
- Set as default (if you wish)
- Select the Tag option for the  Data Source
- Add the hashtag #Together to the Tag section
- Click Save

## Who else to send questions to?
The plugin has also generated a file called "Pertinent Contacts" - this has a list of websites in various countries with information on how to contact elected representatives, it also shows who are the World Economic Forum partners who you may want to let know do not deserve your patronage as a result...

## Your Own Question Tranches OR Other Campaign Tranches
The Together movement can potentially have specific tranches created just for local groups - in terms of customised campaigns/info and directed to local councillors in particular. 

Others too. 

There is no limit to the questions you can add to the input Questions Folder.

### Adding your own questions - Simple addition
As previously mentioned, you can add your own questions to your own raw Questions folder.

Questions should be added to a specific category like so:
- /Questions/Category1/Question1.md
- /Questions/Category2/Question1.md

where 
- 'Category' is whatever category you wish to add a question to and 
- 'Question' is the filename/question name you are adding

You can just type your question or campaign into the obsidian note/file you create and generate Pertinent Questions in the normal way. You will not have captured all the metadata with this technique so the email will be a bit spartan w.r.t. the Image and Video section for example.

### Still Simple but more functionality Question Addition
If you wish to add questions with full metadata, all you need do is create a question in the normal fashion just described but after your question section, add the following metadata as specified in the instructions section (which you should delete after you have filled in the fields below it.)

YOUR QUESTION GOES HERE...

---START - DELETE AFTER FILLING IN THE FIELDS ---

Instructions
- Ensure all fields filled out below and
- Video is the full embed video iframe
- Tags have no hashtag and are comma separated, examples below Tranche1 and Global
- Campaign related information (the 'Note:' item, the campaign: and deadline: fields should be removed if this is not a campaign)
- The ![[Footer]] item is optional - you can use the existing Footer file and/or edit it to your own tastes
- Note: All metadata tags below must have values or some errors can occur during pertinennt question generation

---END DELETE SECTION---

Note: Deadline indicative - no end date for this campaign

campaign: true | false

deadline: YYYY-MM-DD

tags:Tranche1,Global

image: ![IMAGE DESCRIPTION GOES HERE](LINK TO IMAGE GOES HERE)

video: EMBED iFrame

![[Footer]]
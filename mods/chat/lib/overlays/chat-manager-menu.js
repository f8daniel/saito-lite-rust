const chatMenuTemplate = require('./chat-manager-menu.template');
const ContactsList = require('./../../../../lib/saito/ui/modals/saito-contacts/saito-contacts');
const SaitoOverlay = require('./../../../../lib/saito/ui/saito-overlay/saito-overlay');
const ChatList = require('./chat-list');
const ChatUserMenu = require('./chat-user-menu');

class ChatManagerMenu {
	constructor(app, mod, container) {
		this.app = app;
		this.mod = mod;

		this.container = container;

		this.contactList = new ContactsList(app, mod, true);

		this.chatList = new ChatList(app, mod);
		this.chatList.callback = (gid) => {
			let chatMenu = new ChatUserMenu(
				this.app,
				this.mod,
				this.mod.returnGroup(gid)
			);
			chatMenu.render();
		};
	}

	async render() {
		if (!this.container) {
			let overlay = new SaitoOverlay(this.app, this.mod);
			overlay.show(
				`<div class="module-settings-overlay"><h2>Chat Settings</h2></div>`
			);
			this.container = '.module-settings-overlay';
		}

		if (document.querySelector('.saito-module-settings')) {
			this.app.browser.replaceElementBySelector(
				chatMenuTemplate(this.app, this.mod),
				'.saito-module-settings'
			);
		} else {
			this.app.browser.addElementToSelector(
				chatMenuTemplate(this.app, this.mod),
				this.container
			);
		}

		this.attachEvents();
	}

	attachEvents() {
		if (document.getElementById('add-contacts')) {
			document.getElementById('add-contacts').onclick = (e) => {
				this.contactList.multi_select = false;
				this.contactList.callback = async (person) => {
					if (person) {
						this.app.connection.emit('open-chat-with', {
							key: person
						});
					}
				};
				this.contactList.render();
			};
		}

		if (document.getElementById('create-group')) {
			document.getElementById('create-group').onclick = async (e) => {
				this.contactList.multi_select = true;
				this.contactList.title = "Invite Contacts";
				
				this.contactList.callback = (person) => {
					person.push(this.mod.publicKey);
					this.mod.sendCreateGroupTransaction(name, person);
				};

				let name = await sprompt('Choose a name for the group');
				if (name){
					let myKeys = this.app.keychain.returnKeys();
					if (myKeys.length > 0){
						this.contactList.render();		
					}else{
						this.mod.sendCreateGroupTransaction(name);		
					}
				}
			};
		}

		if (document.getElementById('edit-contacts')) {
			document.getElementById('edit-contacts').onclick = (e) => {
				this.chatList.render();
			};
		}

		if (document.getElementById('enable-notifications')) {
			document
				.getElementById('enable-notifications')
				.addEventListener('change', (e) => {
					if (e.currentTarget.checked) {
						Notification.requestPermission().then((result) => {
							if (result === 'granted') {
								this.mod.enable_notifications = true;
								siteMessage(
									'System Notifications granted for Chat Messages',
									3000
								);
							} else {
								siteMessage(
									'Error enabling System Notifications',
									3000
								);
							}
						});
					} else {
						this.mod.enable_notifications = false;
						siteMessage(
							'System Notifications turned off for Chat Messages',
							3000
						);
					}
					this.mod.saveOptions();
				});
		}

		if (document.getElementById('audio-notifications')) {
			document
				.getElementById('audio-notifications')
				.addEventListener('change', (e) => {
					if (e.currentTarget.checked) {
						this.mod.audio_notifications = true;
					} else {
						this.mod.audio_notifications = false;
					}
					this.mod.saveOptions();
				});
		}

		if (document.getElementById('auto-open')) {
			document
				.getElementById('auto-open')
				.addEventListener('change', (e) => {
					if (e.currentTarget.checked) {
						this.mod.auto_open_community = true;
					} else {
						this.mod.auto_open_community = false;
					}
					this.mod.saveOptions();
				});
		}

		if (document.getElementById('chat-link')) {
			document
				.getElementById('chat-link')
				.addEventListener('click', (e) => {
					let link =
						window.location.origin +
						'/chat?chat_id=' +
						this.mod.publicKey;
					navigator.clipboard.writeText(link);
					siteMessage('Link Copied', 2000);
				});
		}
	}
}

module.exports = ChatManagerMenu;

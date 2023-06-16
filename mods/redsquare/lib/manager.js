const TweetManagerTemplate = require("./manager.template");
const Tweet = require("./tweet");
const SaitoProfile = require("./../../../lib/saito/ui/saito-profile/saito-profile");
const SaitoLoader = require("./../../../lib/saito/ui/saito-loader/saito-loader");


class TweetManager {

  constructor(app, mod, container = "", tx = null) {

    this.app = app;
    this.mod = mod;
    this.container = container;

    this.mode = "tweets";
    this.thread_id = "";
    this.parent_id = "";

    this.profile = new SaitoProfile(app, mod, ".saito-main");

    //
    // dynamic loading
    //
    this.intersection_loader = new SaitoLoader(app, mod, "#redsquare-intersection");
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {

          this.intersection_loader.render();

	  if (this.mode == "tweets") {
            mod.loadTweets(null, () => {
	      this.intersection_loader.hide();
      	      for (let i = 0; i < this.mod.tweets.length; i++) {
      	        let tweet = this.mod.tweets[i];
console.log("checking tweet: " + i);
        	if (!tweet.isRendered()) {
console.log("rendering new tweet!");
		  tweet.renderWithCriticalChild();
		}
      	      }
	    });
	  }

	  if (this.mode == "notifications") {
            mod.loadNotifications(null, (txs) => {
	      this.intersection_loader.hide();
	    });
	  }

	  if (this.mode == "profile") {
            mod.loadTweets(null, () => { this.intersection_loader.hide() });
	  }

        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 1
    });


  }

  //
  // this renders a tweet, loads all of its available children and adds them to the page
  // as they appear...
  //
  renderTweet(tweet) {

    this.intersectionObserver.unobserve(document.querySelector('#redsquare-intersection'));


    let myqs = `.tweet-manager`;

    if (!document.querySelector(myqs)) {
      this.app.browser.addElementToSelector(TweetManagerTemplate(), this.container);
    } else {
      this.app.browser.replaceElementBySelector(TweetManagerTemplate(), myqs);
    }

    this.mode = "tweets";
    this.profile.remove();

    tweet.render();
    this.intersection_loader.render();
    this.mod.loadTweetChildren(null, tweet.tx.transaction.sig, () => {
console.log("render tweet with children...");
      tweet.renderWithChildren();
      this.intersection_loader.hide();
    });

  }





  render() {

    let myqs = `.tweet-manager`;

    if (!document.querySelector(myqs)) {
      this.app.browser.addElementToSelector(TweetManagerTemplate(), this.container);
    } else {
      this.app.browser.replaceElementBySelector(TweetManagerTemplate(), myqs);
    }

    ////////////
    // tweets //
    ////////////
    if (this.mode == "tweets") {

      this.profile.remove();

      for (let i = 0; i < this.mod.tweets.length; i++) {
        let tweet = this.mod.tweets[i];
        tweet.renderWithCriticalChild();
      }

    }

    ///////////////////
    // notifications //
    ///////////////////
    if (this.mode == "notifications") {

      this.profile.remove();

      for (let i = 0; i < this.mod.notifications.length; i++) {
        let notification = new Notification(this.app, this.mod, this.mod.notifications[i].tx);
        notification.render(".tweet-manager");
      }

    }

    /////////////
    // profile //
    /////////////
    if (this.mode == "profile") {
      this.profile.render();
    }
 
    this.attachEvents();

  }

  attachEvents() {

    //
    // dynamic content loading
    //
    this.intersectionObserver.observe(document.querySelector('#redsquare-intersection'));

  }

}

module.exports = TweetManager;


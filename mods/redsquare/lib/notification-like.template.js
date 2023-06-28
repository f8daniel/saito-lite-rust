
module.exports = (app, mod, tx) => {

    let txmsg = tx.returnMessage();
    let txsig = "";
    let tweet_to_show = "";
    let from = tx.transaction.from[0].add;

    if (txmsg.data?.sig) { txsig = txmsg.data.sig; }

    return `
        <div class="tweet tweet-notification notification-item-${from}-${txsig} tweet-notif-fav" data-id="${txsig}">
          <div class="tweet-notice"></div>
          <div class="tweet-header"></div>
          <div class="tweet-body">
            <div class="tweet-sidebar"></div>
            <div class="tweet-main">
              <div class="tweet-preview"></div>
            </div>
          </div>
        </div>
    `;

}


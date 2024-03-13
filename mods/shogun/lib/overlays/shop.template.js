module.exports = ShopOverlayTemplate = (mod, prompt) => {
	
  let html = `
    <div class="shop-overlay">
      <div class="shop-title">${prompt}</div>
      <div class="cardbox-header">Card Details</div>
      <div class="cardstacks">
  `;

    for (let c in mod.game.state.supply){
      if (c !== "curse"){
        let count = Math.max(0, mod.game.state.supply[c]); 

        html += `<div class="cardpile ${!prompt? "showcard":""}" id="${c}">`;
        html += `<div class="card_count">${count}</div>`;
        html += mod.returnCardImage(c, false);
        html += "</div>";  
      }
    }

  html += "</div>";

  html += `<div class="card-preview"></div>`;

  html += "</div>";

  return html;
};




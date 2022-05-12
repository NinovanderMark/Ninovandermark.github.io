document.addEventListener("DOMContentLoaded", function(event) { 
    // Greet any curious visitors opening the developer tools
    console.log("%cWelcome to Nino's Personal Pages!", "font-size: 18px; color: #00A");
    console.log("%cI appreciate your interest in the inner workings of my website. " +
        "The link in the footer takes you to the GitHub repository for this website. Enjoy!",
        "display: inline-block; border-top: 2px solid #eee; padding: 10px; color: #070; font-weight: bold;");

    addScript('/scripts/footer.js');
});

function addScript(filepath) {
    var head = document.head;
    var script = document.createElement('script');
    script.type = 'text/javascript';
  
    let today = new Date();
    script.src = filepath;

    // Fire the loading
    head.appendChild(script);
}

function randomNumber(max) {
    return Math.floor(Math.random() * max);
}
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

(function() {
    let messages = [
        "Powered by the <span class='glow'>Holy Spirit</span> and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Powered by the grace of God and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Powered by the love of Jesus and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Powered by HTML5 and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Powered by a history of mucking about with computers and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Powered by random number generators and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!"
    ];

    if ( randomNumber(4) === 3)
        return;

    let index = randomNumber(messages.length);
    let p = document.querySelectorAll('footer p');
    if ( p.length < 1)
        return;

    p[0].innerHTML = `Copyright ©2025 Nino van der Mark - ${messages[index]}`;
})()
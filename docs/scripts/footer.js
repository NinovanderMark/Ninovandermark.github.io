(function() {
    let messages = [
        "Website is powered by the <span class='glow'>Holy Spirit</span> and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Website is powered by the grace of God and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Website is powered by the love of Jesus and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Website is powered by HTML5 and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Website is powered by a history of mucking about with computers and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!",
        "Website is powered by random number generators and hosted on <a href='https://github.com/NinovanderMark/Ninovandermark.github.io'>GitHub Pages</a>!"
    ];

    if ( randomNumber(4) === 3)
        return;

    let index = randomNumber(messages.length);
    let p = document.querySelectorAll('footer p');
    if ( p.length < 1)
        return;

    p[0].innerHTML = messages[index];
})()
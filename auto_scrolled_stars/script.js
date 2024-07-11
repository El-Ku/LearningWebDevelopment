let max_width = 0;
let max_height = 0;
let stars = [];
let coords = []
let travel_on = 0;

// display the mouse coordinates on the screen when I move it on the page
document,addEventListener('mousemove', function(Event) {
    const elem = document.getElementById("coords");
    elem.style.position = "absolute";
    const x = Event.clientX + "px";
    const y = Event.clientY + "px";
    elem.style.left = x;
    elem.style.top = y;
    elem.style.color = "white";
    elem.style.fontSize = "12px";
    elem.textContent = `${x} , ${y}`;
})

// wait for any keypress event. if its space key, the call the 
// startSpaceTravel function
document.addEventListener('keypress', function(Event) {
    if(Event.code == 'Space') {
        travel_on = (travel_on == 0) ? 1 : 0;
        startSpaceTravel();
    }
});

// intialize the screen with 100's of small circles. all are randomly placed.
// I am supposed to be the bottom of the screen at the center. Based on 'my' 
// distance from the stars their 'brighness' is decreased. 
function createStarrySky() {
    let body = document.body
    max_width = window.innerWidth;
    max_height = window.innerHeight;
    my_eye_pos = [Math.floor(max_width/2), Math.floor(max_height)];
    max_distance = Math.floor(Math.sqrt(Math.pow(my_eye_pos[0], 2) +
     Math.pow(my_eye_pos[1], 2)));
    console.log(max_distance);
    console.log(max_width, max_height);
    body.style.backgroundColor = "black";
    stars = []
    let dist = 0;
    for(let i = 0; i < 200; i++) {
        stars[i] = document.createElement("div");
        stars[i].classList.add("circle");
        stars[i].style.position = "absolute";
        const x = Math.floor(Math.random() * max_width);
        const y = Math.floor(Math.random() * max_height);
        coords.push([x,y]).
        dist = Math.floor(Math.sqrt(Math.pow(x - my_eye_pos[0], 2) + 
        Math.pow(y - my_eye_pos[1], 2)));
        stars[i].style.left = x + "px";
        stars[i].style.top = y + "px";
        // console.log(stars[i].style.left, stars[i].style.right)
        stars[i].style.width = "5px";
        stars[i].style.height = "5px";
        color = 100 - dist/max_distance * 100;
        stars[i].style.backgroundColor = `hsl(0, 0%, ${color}%)` 
        stars[i].style.borderRadius = "50%";
        body.appendChild(stars[i]);
    }
}

// make the contents scroll down. as if to emulate I am moving forward in space. 
// (I know it looks nothing like that at the moment).
// the star's brightness need to be recalculated after their positions are changed.
// outof screen stars are placed at the bottom of the screen, but their x-axis coord is
// randomly selected again.
// how many pixels it goes down every step and how often it goes down can be set in the code.
async function startSpaceTravel() {
    console.log('Button was clicked');
    // update the coordinates first. pull down the screen.
    let dist = 0;

    function wait_for(msecs) {
        return new Promise(resolve => setTimeout(resolve, msecs));
    }
    const scroll_speed = 4;
    const wait_time = 100;  //msecs
    while(travel_on == 1) {
        console.log(coords[0], 1)
        console.log('updating coordinates...');
        for(let i=0;i<stars.length;i++) {
            if(coords[i][1] + scroll_speed > max_height) {
                coords[i][1] =  scroll_speed;
                coords[i][0] = Math.floor(Math.random() * max_width);
            } else {
                coords[i][1] =  coords[i][1] + scroll_speed;
            }
            stars[i].style.left = coords[i][0] + "px";
            stars[i].style.top = coords[i][1] + "px";
            dist = Math.floor(Math.sqrt(Math.pow(coords[i][0] - my_eye_pos[0], 2) + Math.pow(coords[i][1] - my_eye_pos[1], 2)));
            // console.log(stars[i].style.left, stars[i].style.right)
            color = 100 - dist/max_distance * 100;
            stars[i].style.backgroundColor = `hsl(0, 0%, ${color}%)` //"hsl(0, ${color}%, 100%)";
        }
        await wait_for(wait_time);
    }
}
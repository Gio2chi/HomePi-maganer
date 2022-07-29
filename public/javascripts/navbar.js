let button = document.getElementById('bars')
let navbar = document.getElementById('navbar')

button.addEventListener('click', () => {
    navbar.classList.toggle('active')
    button.classList.toggle('active')
})
let TASKS = {}
let CURRENT_EDIT = null
let STATE = "normal"  // can be normal or dialogue
let AGENDA = []
let MAXID = 1

let getCurrentDate = () => {
    const d = new Date()
    return d.toISOString().substr(0, 10)
}
let loadTasks = () => {
    TASKS = localStorage.getItem("tasks") ? JSON.parse(localStorage.getItem("tasks")) : {}
    TASKS = TASKS || {}
    if (TASKS && Object.keys(TASKS) && Object.keys(TASKS).length) {
        const currentDate = getCurrentDate()
        Object.entries(TASKS).forEach(entry => {
            const key = entry[0]
            const value = entry[1]
            if (value.oneOff && value.oneOff !== currentDate) {
                delete TASKS[key]
            }
        })
        MAXID = Math.max(...Object.keys(TASKS).map((key) => parseInt(key)))
    } else {
        MAXID = 1
    }
}
let saveTasks = () => {
    localStorage.setItem("tasks", JSON.stringify(TASKS))
}
let updateDialogue = () => {
    const dialogue = document.querySelector("#dialogue")
    if (STATE === "dialogue")
        dialogue.classList.remove("hidden")
    else
        dialogue.classList.add("hidden")
}
let showDialogue = () => {
    STATE = "dialogue"
    if (CURRENT_EDIT) {
        const currentTask = TASKS[CURRENT_EDIT]
        document.querySelector("#dialogue #name").value = currentTask.name
        document.querySelector("#dialogue #optional").checked = currentTask.optional
        document.querySelector("#dialogue #one-off").checked = currentTask.oneOff
        document.querySelector("#dialogue #delete").classList.remove("hidden")
    }
    updateDialogue()
}
let abortDialogue = () => {
    STATE = "normal"
    CURRENT_EDIT = null
    document.querySelector("#dialogue #name").value = ""
    document.querySelector("#dialogue #optional").checked = false
    document.querySelector("#dialogue #one-off").checked = false
    document.querySelector("#dialogue #delete").classList.add("hidden")
    updateDialogue()
}
let saveDialogue = () => {
    let currentTask = null
    if (CURRENT_EDIT) {
        currentTask = TASKS[CURRENT_EDIT]
    } else {
        MAXID += 1
        currentTask = {id: MAXID}
    }
    currentTask.name = document.querySelector("#dialogue #name").value
    currentTask.optional = document.querySelector("#dialogue #optional").checked
    currentTask.oneOff = document.querySelector("#dialogue #one-off").checked ? getCurrentDate() : false
    TASKS[currentTask.id] = currentTask
    console.log(TASKS)
    saveTasks()
    abortDialogue()
    updateDisplay()
}
let deleteDialogue = () => {
    if (CURRENT_EDIT) {
        delete TASKS[CURRENT_EDIT]
    }
    saveTasks()
    abortDialogue()
    updateDisplay()
}
editTask = (e) => {
    let target = e.target
    while (!target.id) {
        target = target.parentElement
    }
    CURRENT_EDIT = target.id
    showDialogue()
}

let updateDisplay = () => {
    updateDialogue()
    document.querySelectorAll("#all-tasks .task").forEach(e => e.parentNode.removeChild(e))
    Object.values(TASKS).forEach(task => {
        const taskBox = document.createElement("div")
        taskBox.classList.add("card")
        taskBox.classList.add("task")
        taskBox.id = task.id
        const taskContent = document.createTextNode(task.name)
        taskBox.appendChild(taskContent)
        if (task.optional) {
            taskBox.classList.add("optional")
            marker = document.createElement("p")
            marker.classList.add("hint")
            const markerContent = document.createTextNode(("(optional)"))
            marker.appendChild(markerContent)
            taskBox.appendChild(marker)
        }
        if (task.oneOff) {
            taskBox.classList.add("one-off")
            marker = document.createElement("p")
            marker.classList.add("hint")
            const markerContent = document.createTextNode(("(one-off)"))
            marker.appendChild(markerContent)
            taskBox.appendChild(marker)
        }
        document.querySelector("#all-tasks").appendChild(taskBox)
        taskBox.addEventListener("click", editTask)
    })
}
let generateAgenda = () => {
    if (!Object.keys(TASKS).length) {
        showDialogue()
        alert("Cannot generate agenda without tasks, add one first!")
        return
    }
    document.querySelector("#agenda-missing").classList.add("hidden")
    document.querySelectorAll("#agenda ol li").forEach(e => e.parentNode.removeChild(e))
    AGENDA = Object.values(TASKS).filter(task => {
        return !task.optional || Math.random() > 0.4
    })
    AGENDA.sort(() => 0.5 - Math.random())
    AGENDA.forEach(task => {
        const taskBox = document.createElement("li")
        const taskContent = document.createTextNode(task.name)
        taskBox.appendChild(taskContent)
        document.querySelector("#agenda ol").appendChild(taskBox)
    })
}

let initEventListeners = () => {
    document.querySelector("#action").addEventListener("click", generateAgenda)
    document.querySelector("#add-new").addEventListener("click", showDialogue)
    document.querySelector("#save").addEventListener("click", saveDialogue)
    document.querySelector("#abort").addEventListener("click", abortDialogue)
    document.querySelector("#delete").addEventListener("click", deleteDialogue)
}

document.addEventListener("DOMContentLoaded", function() {
    initEventListeners()
    loadTasks()
    if (Object.keys(TASKS).length) {
        generateAgenda()
    }
    updateDisplay()
})

let TASKS = {}
let CURRENT_EDIT = null
let STATE = "normal"  // can be normal or dialog
let AGENDA = []
let MAXID = 1

let getCurrentDate = () => {
    const d = new Date()
    return d.toISOString().substr(0, 10)
}
let loadData = () => {
    TASKS = localStorage.getItem("tasks") ? JSON.parse(localStorage.getItem("tasks")) : {}
    TASKS = TASKS || {}
    if (TASKS && Object.keys(TASKS) && Object.keys(TASKS).length) {
        const currentDate = getCurrentDate()
        Object.entries(TASKS).forEach(entry => {
            const key = entry[0]
            const value = entry[1]
            if (value.done && value.done !== currentDate) {
                value.done = false
            }
            if (value.oneOff && value.oneOff !== currentDate) {
                delete TASKS[key]
            }
        })
        MAXID = Math.max(...Object.keys(TASKS).map((key) => parseInt(key)))
    } else {
        MAXID = 1
    }
    let agendaData = localStorage.getItem("agenda") ? JSON.parse(localStorage.getItem("agenda")) : {}
    agendaData = agendaData || {}
    if (agendaData && agendaData[getCurrentDate()]) {
        AGENDA = agendaData[getCurrentDate()]
    }
}
let saveData = () => {
    localStorage.setItem("tasks", JSON.stringify(TASKS))
    let agendaData = {}
    agendaData[getCurrentDate()] = AGENDA
    localStorage.setItem("agenda", JSON.stringify(agendaData))
}
let updateDialog = () => {
    const dialog = document.querySelector("#dialog")
    if (STATE === "dialog")
        dialog.classList.remove("hidden")
    else
        dialog.classList.add("hidden")
}
let showDialog = () => {
    STATE = "dialog"
    if (CURRENT_EDIT) {
        const currentTask = TASKS[CURRENT_EDIT]
        document.querySelector("#dialog #name").value = currentTask.name
        document.querySelector("#dialog #optional").checked = currentTask.optional
        document.querySelector("#dialog #one-off").checked = currentTask.oneOff
        document.querySelector("#dialog #delete").classList.remove("hidden")
    }
    updateDialog()
}
let abortDialog = () => {
    STATE = "normal"
    CURRENT_EDIT = null
    document.querySelector("#dialog #name").value = ""
    document.querySelector("#dialog #optional").checked = false
    document.querySelector("#dialog #one-off").checked = false
    document.querySelector("#dialog #delete").classList.add("hidden")
    updateDialog()
}
let saveDialog = () => {
    let currentTask = null
    if (CURRENT_EDIT) {
        currentTask = TASKS[CURRENT_EDIT]
    } else {
        MAXID += 1
        currentTask = {id: MAXID}
    }
    currentTask.name = document.querySelector("#dialog #name").value
    currentTask.optional = document.querySelector("#dialog #optional").checked
    currentTask.oneOff = document.querySelector("#dialog #one-off").checked ? getCurrentDate() : false
    TASKS[currentTask.id] = currentTask
    console.log(TASKS)
    saveData()
    abortDialog()
    updateDisplay()
}
let deleteDialog = () => {
    if (CURRENT_EDIT) {
        delete TASKS[CURRENT_EDIT]
    }
    saveData()
    abortDialog()
    updateDisplay()
}
editTask = (e) => {
    let target = e.target
    while (!target.id) {
        target = target.parentElement
    }
    CURRENT_EDIT = target.id
    showDialog()
}
toggleDone = (e) => {
    let target = e.target
    while (!target.dataset.id) {
        target = target.parentElement
    }
    TASKS[target.dataset.id].done = TASKS[target.dataset.id].done ? false : getCurrentDate()
    saveData()
    updateDisplay()
    redrawAgenda()
}

let updateDisplay = () => {
    updateDialog()
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
        if (task.done && task.done === getCurrentDate()) {
            taskBox.classList.add("done")
        }
        document.querySelector("#all-tasks").appendChild(taskBox)
        taskBox.addEventListener("click", editTask)
    })
}
let redrawAgenda = () => {
    document.querySelectorAll("#agenda ol li").forEach(e => e.parentNode.removeChild(e))
    document.querySelectorAll("#agenda .subtitle span").forEach(e => e.parentNode.removeChild(e))
    if (AGENDA.length) {
        document.querySelector("#agenda-missing").classList.add("hidden")
    } else {
        return
    }
    let doneTasks = 0
    AGENDA.forEach(taskID => {
        const task = TASKS[taskID]
        if (!task) return
        const taskBox = document.createElement("li")
        const taskContent = document.createTextNode(task.name)
        taskBox.appendChild(taskContent)
        taskBox.id = "agenda" + task.id
        taskBox.dataset.id = task.id
        if (task.done && task.done === getCurrentDate()) {
            taskBox.classList.add("done")
            doneTasks += 1
        }
        taskBox.addEventListener("click", toggleDone)
        document.querySelector("#agenda ol").appendChild(taskBox)
    })
    const progressBox = document.createElement("span")
    const progressContent = document.createTextNode(" (" + doneTasks + "/" + AGENDA.length + ")")
    progressBox.appendChild(progressContent)
    document.querySelector("#agenda .subtitle").appendChild(progressBox)
}
let generateAgenda = () => {
    if (!Object.keys(TASKS).length) {
        showDialog()
        alert("Cannot generate agenda without tasks, add one first!")
        return
    }
    let agendaList = Object.values(TASKS).filter(task => {
        return !task.optional || Math.random() > 0.4
    })
    agendaList.sort((task1, task2) => {
        if (task1.done && task1.done === getCurrentDate()) {
            return -task1.id
        }
        if (task2.done && task2.done === getCurrentDate()) {
            return task2.id
        }
        return 0.5 - Math.random()
    })
    AGENDA = agendaList.map(task => task.id)
    saveData()
    redrawAgenda()
}

let initEventListeners = () => {
    document.querySelector("#action").addEventListener("click", generateAgenda)
    document.querySelector("#add-new").addEventListener("click", showDialog)
    document.querySelector("#save").addEventListener("click", saveDialog)
    document.querySelector("#abort").addEventListener("click", abortDialog)
    document.querySelector("#delete").addEventListener("click", deleteDialog)
    document.onkeyup = (e) => {
        if (STATE === "dialog") {
            e = e || window.event
            const charCode = (typeof e.which == "number") ? e.which : e.keyCode;
            if (charCode == 27) {
                abortDialog()
            } else if (charCode == 13) {
                saveDialog()
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    initEventListeners()
    loadData()
    if (Object.keys(TASKS).length && !AGENDA.length) {
        generateAgenda()
    } else {
        redrawAgenda()
    }
    updateDisplay()
})

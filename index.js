const mysql = require('mysql2')
const cookieParser = require('cookie-parser')
const express = require('express')

const app = express()

const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
})

users = []
connections = []

io.sockets.on('connection', function(socket) {
    console.log("Connection successful")
    connections.push(socket)

    socket.on('disconnect', function(data) {
        connections.splice(connections.indexOf(socket), 1)
        console.log("Disconnection successful")
    })

    socket.on('send mess', function(data) {

        const now = new Date()

        const year = now.getFullYear()
        const month = ("0" + (now.getMonth() + 1)).slice(-2)
        const day = ("0" + now.getDate()).slice(-2)

        const hour = ("0" + now.getHours()).slice(-2)
        const minute = ("0" + now.getMinutes()).slice(-2)
        const second = ("0" + now.getSeconds()).slice(-2)

        // YYYY-MM-DD hh:mm:ss
        const formatted = `${day}-${month}-${year} ${hour}:${minute}:${second}`
    
        db.query('INSERT INTO messages(request_id, message_admin, message_text, message_user, message_date) VALUES (?,?,?,?,?)', 
        [data.req_id, data.isadmin, data.message_text, data.user_id, formatted], (error, results) => {
            if (error) {
                console.log("Error connecting to database")
            }
        })
        io.sockets.emit('add mess', { req_id: data.req_id, isadmin: data.isadmin, message_text: data.message_text, user_name: data.user_name, profile_picture: data.profile_picture, message_date: formatted })
    })

})

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "support",
    password: "Zuma8268"
})

db.connect( err => {
    if (err) {
        console.log(err)
        return err
    } else {
        console.log('Database ----- OK')
    }
})

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false}))
app.use(cookieParser())
app.use(cors({ origin: "*" }));

app.get('/', (req, res) => {
    res.render('index', { error_message: "" })
}) 

app.post('/login', (req, res) => {
    console.log(req.body)

    const { login, password } = req.body

    db.query('SELECT id FROM users WHERE login = ? and password = ?', [login, password], (error, results) => {
        if (error) {
            console.log("Error connecting to database")
        }
        if (results.length > 0) {
            res.cookie('logged_user', results[0].id)
            res.redirect("/admin");
        } else {
            res.render('index', { error_message: "Пользователь не найден" })
        }
    })

})
app.get('/admin', (req, res) => {

    var { cookies } = req
    var logged_user = 1

    if ( "logged_user" in cookies ) {
        logged_user = cookies.logged_user
    } else {
        res.redirect("/");
    }

    db.query('SELECT * FROM users WHERE id = ?', [logged_user] ,(error, results) => {
        if (error) {
            console.log("Error connecting to database")
        }
            res.render('admin', { user: results[0] })
    })

})

app.get('/admin/requests', (req, res) => {

    var { cookies } = req
    var logged_user = 1

    if ( "logged_user" in cookies ) {
        logged_user = cookies.logged_user
    } else {
        res.redirect("/");
    }

    var res1;
    var res2;

    db.query('SELECT * FROM users WHERE id = ?', [logged_user] ,(error, results) => {
        if (error) {
            console.log("Error connecting to database")
        }
        res1 = results
    })
    db.query('SELECT * FROM users', (error, results) => {
        if (error) {
            console.log("Error connecting to database")
        }
        res2 = results
    })
    db.query('SELECT requests.id, status, text, date, users.name as user FROM requests INNER JOIN users ON requests.user = users.id ORDER BY requests.id', (error, results) => {
        if (error) {
            console.log("Error connecting to database")
        }
        res.render('admin_requests', { requests: results, user: res1[0] })
    })

}) 

app.get('/admin/requests/:id', (req, res) => {
    var { cookies } = req
    var logged_user = 1

    if ( "logged_user" in cookies ) {
        logged_user = cookies.logged_user
    } else {
        res.redirect("/");
    }

    var res1;

    db.query('SELECT * FROM users WHERE id = ?', [logged_user] ,(error, results) => {
        if (error) {
            console.log("Error connecting to database")
        }
        res1 = results
    })

    db.query("SELECT messages.id, request_id, message_admin, message_text, users.name as user_name, message_date, users.profile_picture FROM messages INNER JOIN users ON message_user = users.id WHERE request_id = ? ORDER BY messages.id", [req.params.id], (error, results) => {
        if (error) {
            console.log("Error connecting to database")
        }
        res.render('admin_requests_messager', { messages: results, user: res1[0], req_id: req.params.id })
    })
}) 
/*
app.post('/admin/requests/:id', (req, res) => {

    var { cookies } = req
    var logged_user = 1

    if ( "logged_user" in cookies ) {
        logged_user = cookies.logged_user
    } else {
        res.redirect("/")
    }

    const { message_text } = req.body
    
    const now = new Date()

    const year = now.getFullYear()
    const month = ("0" + (now.getMonth() + 1)).slice(-2)
    const day = ("0" + now.getDate()).slice(-2)

    const hour = ("0" + now.getHours()).slice(-2)
    const minute = ("0" + now.getMinutes()).slice(-2)
    const second = ("0" + now.getSeconds()).slice(-2)

    // YYYY-MM-DD hh:mm:ss
    const formatted = `${day}-${month}-${year} ${hour}:${minute}:${second}`

    db.query('SELECT * FROM users WHERE id = ?', [logged_user] ,(error, results) => {
        if (error) {
            console.log("Error connecting to database")
        }
        db.query('INSERT INTO messages(request_id, message_admin, message_text, message_user, message_date) VALUES (?,?,?,?,?)', [req.params.id, results[0].isadmin, message_text, logged_user, formatted], (error, results) => {
            if (error) {
                console.log("Error connecting to database")
            }
                res.redirect("/admin/requests/"+req.params.id)
        })
    })

})
*/

server.listen(8080, () => {
    console.log('Server started: http://localhost:8080')
})
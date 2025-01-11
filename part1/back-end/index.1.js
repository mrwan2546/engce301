const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.get('/hello', (req, res) => {
    res.send('Hello World 2nd Text.')
  })

app.listen(3001, () => {
  console.log('Start API Server at port 3001.')
})

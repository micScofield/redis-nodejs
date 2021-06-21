const express = require('express')
const redis = require('redis')
const fetch = require('node-fetch')

const PORT = process.env.PORT || 5000
const REDIS_PORT = process.env.REDIS_PORT || 6379

const client = redis.createClient(REDIS_PORT)

const app = express()

// set repsonse method
const setResponse = (username, repo_count) => {
    return `<h2>${username} has ${repo_count} github repositories !</h2>`
}

// Make request to github for data
const getRepos = async (req, res) => {

    const { username } = req.params

    try {
        console.log('fetching data from api...')

        const response = await fetch(`https://api.github.com/users/${username}`)

        const data = await response.json()

        const repo_count = data.public_repos

        // Set this count to redis
        client.setex(username, 3600, repo_count) //expiration duration is in seconds

        res.send(setResponse(username, repo_count))

    } catch (error) {
        console.log(err)
        res.status(500)
    }
}

// Cache middleware
const cache = (req, res, next) => {
    const { username } = req.params

    client.get(username, (err, data) => {
        if (err) throw err

        if (data !== null) res.send(setResponse(username, data))
        else next()
    })
}

app.get('/repos/:username', cache, getRepos)

app.listen(PORT, () => console.log(`Server started on ${PORT}`))
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = 5000;

app.use(cors({
  origin: 'http://localhost:3000', // Frontend address
  credentials: true, // Allow sending cookies
}));

app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
  secret: 'your_secret_key', // Replace with a secret key
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS, false for local development
    maxAge: 1000 * 60 * 60 * 24, // 24 hours or as required
  }
}));

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'mypass1234',
  database: 'nodejs',
  port: 3307,
};

const connection = mysql.createConnection(dbConfig);

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Get all blogs
app.get('/blogs', (req, res) => {
  const query = 'SELECT * FROM blogs';
  connection.query(query, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).json(results);
    }
  });
});

// Get blog by slug
app.get('/api/blogs/:slug', (req, res) => {
  const blogSlug = req.params.slug;
  const query = 'SELECT * FROM blogs WHERE SLUG = ?';

  connection.query(query, [blogSlug], (err, results) => {
    if (err) {
      console.error('Error fetching blog:', err);
      res.status(500).send('Internal Server Error');
    } else if (results.length > 0) {
      const blog = results[0];
      res.json(blog);
    } else {
      res.status(404).send('Blog not found');
    }
  });
});

app.post('/blogs/:id/like', (req, res) => {
  const { id } = req.params;
  const blogID = parseInt(id);

  // Initialize the session arrays if they don't exist
  if (!req.session.likedBlogs) {
    req.session.likedBlogs = [];
  }
  if (!req.session.dislikedBlogs) {
    req.session.dislikedBlogs = [];
  }

  // Check if the user has already liked this blog
  if (req.session.likedBlogs.includes(blogID)) {
    // User is unliking the blog
    req.session.likedBlogs = req.session.likedBlogs.filter(blog => blog !== blogID);
    const query = `UPDATE blogs SET LIKES = LIKES - 1 WHERE id = ?`;
    connection.query(query, [blogID], (err) => {
      if (err) {
        return res.status(500).send('Error updating like count');
      }
      // Return the updated like count
      const updatedQuery = 'SELECT LIKES, DISLIKES FROM blogs WHERE ID = ?';
      connection.query(updatedQuery, [blogID], (err, results) => {
        if (err) {
          return res.status(500).send('Error retrieving updated counts');
        }
        return res.json({ LIKES: results[0].LIKES, DISLIKES: results[0].DISLIKES });
      });
    });
  } else {
    // User is liking the blog
    req.session.likedBlogs.push(blogID);
    
    // If the blog was previously disliked, remove it and update the dislike count
    if (req.session.dislikedBlogs.includes(blogID)) {
      req.session.dislikedBlogs = req.session.dislikedBlogs.filter(blog => blog !== blogID);
      const query = `UPDATE blogs SET DISLIKES = DISLIKES - 1 WHERE id = ?`;
      connection.query(query, [blogID], (err) => {
        if (err) {
          return res.status(500).send('Error updating dislike count');
        }
      });
    }

    const query = `UPDATE blogs SET LIKES = LIKES + 1 WHERE id = ?`;
    connection.query(query, [blogID], (err) => {
      if (err) {
        return res.status(500).send('Error updating like count');
      }
      // Return the updated like count
      const updatedQuery = 'SELECT LIKES, DISLIKES FROM blogs WHERE ID = ?';
      connection.query(updatedQuery, [blogID], (err, results) => {
        if (err) {
          return res.status(500).send('Error retrieving updated counts');
        }
        return res.json({ LIKES: results[0].LIKES, DISLIKES: results[0].DISLIKES });
      });
    });
  }
});

app.post('/blogs/:id/dislike', (req, res) => {
  const { id } = req.params;
  const blogID = parseInt(id);

  // Initialize the session arrays if they don't exist
  if (!req.session.likedBlogs) {
    req.session.likedBlogs = [];
  }
  if (!req.session.dislikedBlogs) {
    req.session.dislikedBlogs = [];
  }

  // Check if the user has already disliked this blog
  if (req.session.dislikedBlogs.includes(blogID)) {
    // User is un-disliking the blog
    req.session.dislikedBlogs = req.session.dislikedBlogs.filter(blog => blog !== blogID);
    const query = `UPDATE blogs SET DISLIKES = DISLIKES - 1 WHERE id = ?`;
    connection.query(query, [blogID], (err) => {
      if (err) {
        return res.status(500).send('Error updating dislike count');
      }
      // Return the updated dislike count
      const updatedQuery = 'SELECT LIKES, DISLIKES FROM blogs WHERE ID = ?';
      connection.query(updatedQuery, [blogID], (err, results) => {
        if (err) {
          return res.status(500).send('Error retrieving updated counts');
        }
        return res.json({ LIKES: results[0].LIKES, DISLIKES: results[0].DISLIKES });
      });
    });
  } else {
    // User is disliking the blog
    req.session.dislikedBlogs.push(blogID);
    
    // If the blog was previously liked, remove it and update the like count
    if (req.session.likedBlogs.includes(blogID)) {
      req.session.likedBlogs = req.session.likedBlogs.filter(blog => blog !== blogID);
      const query = `UPDATE blogs SET LIKES = LIKES - 1 WHERE id = ?`;
      connection.query(query, [blogID], (err) => {
        if (err) {
          return res.status(500).send('Error updating like count');
        }
      });
    }

    const query = `UPDATE blogs SET DISLIKES = DISLIKES + 1 WHERE id = ?`;
    connection.query(query, [blogID], (err) => {
      if (err) {
        return res.status(500).send('Error updating dislike count');
      }
      // Return the updated dislike count
      const updatedQuery = 'SELECT LIKES, DISLIKES FROM blogs WHERE ID = ?';
      connection.query(updatedQuery, [blogID], (err, results) => {
        if (err) {
          return res.status(500).send('Error retrieving updated counts');
        }
        return res.json({ LIKES: results[0].LIKES, DISLIKES: results[0].DISLIKES });
      });
    });
  }
});

app.post('/blogs/:id/comment', (req, res) => {
  const { id } = req.params;
  const { commenterName,content } = req.body; // Get the comment content from the request body
  const blogID = parseInt(id);

  // Insert the comment into the database
  const query = 'INSERT INTO comments (blogID, commenterName, content) VALUES (?, ?, ?)';
  connection.query(query, [blogID, commenterName, content], (err, result) => {
    if (err) {
      return res.status(500).send('Error adding comment');
    }

    // Return the new comment
    const newComment = { id: result.insertId, blogID, commenterName, content, createdAt: new Date() };
    return res.status(201).json(newComment);
  });
});

app.get('/blogs/:id/comments', (req, res) => {
  const { id } = req.params;
  const blogID = parseInt(id);

  // Query to retrieve comments
  const query = 'SELECT * FROM comments WHERE blogID = ? ORDER BY createdAt DESC';
  connection.query(query, [blogID], (err, results) => {
    if (err) {
      return res.status(500).send('Error retrieving comments');
    }
    return res.json(results);
  });
});

// Handle contact form submission
app.post('/api/contact', (req, res) => {
  const { name, email, phone, comments } = req.body;

  const query = 'INSERT INTO CONTACTS (name, email, phone, comments) VALUES (?, ?, ?, ?)';
  connection.query(query, [name, email, phone, comments], (err, results) => {
    if (err) {
      return res.status(500).send('Error submitting contact form');
    }
    res.status(200).send('Contact form submitted successfully!');
  });
});



app.get('/api/categories', (req, res) => {
  const query = 'SELECT id, name, description FROM categories';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

http://localhost:5000/api/blogs?category=${categoryName}
app.get('/api/blogs', (req, res) => {
  const category = req.query.category; // Extract category from query parameters
  
  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  const query = 'SELECT id, SLUG FROM blogs WHERE category = ?';
  
  connection.query(query, [category], (err, results) => {
    if (err) {
      console.error("Error fetching blogs for category:", err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

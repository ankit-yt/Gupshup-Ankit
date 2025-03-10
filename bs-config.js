module.exports = {
    proxy: "http://localhost:3000",
    files: ["views/**/*.ejs", "public/**/*.*"],
    ignore: ["node_modules"],
    reloadDelay: 500,
};


// npm run start   # Start Express.js server
// npm run bs      # Start Browser-Sync
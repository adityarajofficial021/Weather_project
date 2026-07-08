const bookmarkContainer = document.getElementById("bookmark-container");

const bookmarkedArticles = JSON.parse(localStorage.getItem("bookmarks")) || [];

if (bookmarkedArticles.length === 0) {
  bookmarkContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-warning text-center">
                No bookmarked articles found.
            </div>
        </div>
    `;
} else {
  bookmarkedArticles.forEach((article) => {
    bookmarkContainer.innerHTML += `
            <div class="col-md-4 mb-4">

                <div class="card h-100 shadow-sm">

                    <img
                        src="${article.urlToImage || "https://via.placeholder.com/300"}"
                        class="card-img-top"
                        alt="News Image"
                    >

                    <div class="card-body d-flex flex-column">

                        <h5 class="card-title">
                            ${article.title || "No Title"}
                        </h5>

                        <p class="card-text flex-grow-1">
                            ${article.description || "No description available"}
                        </p>

                        <div class="d-flex justify-content-around"> 
                            <a
                            href="${article.url}"
                            target="_blank"
                            class="btn btn-primary"
                            style="width:40%;height:100%"
                            
                        >
                            Read More
                        </a>

                        <button
    class="btn btn-danger delete-btn w-40"
    data-url="${article.url}"
      style="width:40%;height:100%"
>
    🗑 Delete
</button>
                        </div>
                    
                    </div>

                </div>

            </div>
        `;
  });
}


document.addEventListener("click", (e) => {

    if (e.target.classList.contains("delete-btn")) {

        const url = e.target.dataset.url;

        const updatedBookmarks = bookmarkedArticles.filter(
            article => article.url !== url
        );

        localStorage.setItem(
            "bookmarks",
            JSON.stringify(updatedBookmarks)
        );

        location.reload();
    }

});
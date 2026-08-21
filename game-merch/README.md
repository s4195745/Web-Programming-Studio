# LootBox. - E-commerce & Community Platform for Game Merchandises

## Academic Information
* **Institution:** RMIT University
* **Course:** [COSC3060 Web Programming]
* **Assignment:** Assessment Task 2 - Web application prototype

## Team Members (Group HN-G2)
This project was collaboratively built by a team of 5 members. Each member was responsible for a specific functional module of the website.

| Student ID | Full Name          | Role / Module                            |
| s4195745   | Nguyen The Chinh   | Shopping Cart, User Account Management   |
| s4077090   | Hoang Xuan Quynh   | Wishlist, User Account Management        |
| s4197975   | Dang Viet Hoang    | Discussion Forum, Sitemap, Administrator |
| s4200917   | Ho Nguyen Thanh    | Blog, Administrator, Sitemap             |
| s4199811   | Pham Khanh An      | Product Review, User Account Management  |

---

## 📝 Project Description
LootBox is a website prototype for a gaming merchandise marketplace.The platform integrates a shopping experience with community features, allowing users to browse products, read blogs, participate in forum discussions, and manage their personal accounts.

## Tech Stack
* **Backend:** Node.js, Express.js
* **Frontend:** EJS (Embedded JavaScript templating), HTML5, CSS3, Vanilla JS
* **Database:** Simulated Mock Database (`mockDB.js`)
* **Authentication:** Express-Session

---

## 📂 Module Details & File Structure

### 1. Shopping Cart and User Account Management (Nguyen The Chinh)
Handles Shopping Cart, User authenticater.
* Shopping Cart (modules/shopping_cart): `index.html`,`cart.html`, `checkout.html`, `product-detail.html`,`confirmation.html`
* User authenticater (modules/shared_module): `login.html`, `register.html`, `forgot_password.html`, `forgot_password_confimation.html`
* Others: `landing_page.html`, SHARED NAVIGATION nav bar. 
* **CSS:** `assets/css/auth.css`, `assets/css/cart.css`, `assets/css/main.css`, `assets/css/landing_page.css`

### 2. Discussion Forum  and Sitemap (Dang Viet Hoang)
Community area for users to discuss gaming and related topics.
* Disscussion Forum (modules/discussion_forum): `forum.ejs`, `new_thread.ejs`,`thread_detail.ejs`, `edit_thread.ejs`
* Sitemap (views/modules/sitemap):  `sitemap.ejs`
* **CSS:** `assets/css/forum.css` 

### 3. Wishlist (Hoang Xuan Quynh)
Handles Wishlist — save products, mark as purchased, remove, move to cart.
 **View:**
* Wishlist (modules/wishlist): `wishlist.ejs`

**assets/css:**
`assets/css/wishlist.css`

**assets/js:**
`wishlistscript.js`

**routes:** `wishlistRoutes.js`

### 4. Blog and Administrator (Ho Nguyen Thanh)
Handles news and updates, Admin page.
* Blog (modules/blog): `blog.html`, `blog1Blog.html`,`blog2Blog.html`,`UserBlog.html`,
* Administrator (modules/shared_module): `admin.html`
* **CSS:** `assests/css/main`, `assets/css/blog.css`, `assets/admin.css` 

### 5. Product Review and Rating (Pham Khanh An)
Handles Product Review and Rating — write, edit, delete own reviews; browse, search and filter all reviews.
 **View:**
* Product Review (modules/review): `productreview.ejs`

**assets/css:**
`assets/css/productreview.css`

**assets/js:**
`reviewscript.js`

**routes:** `reviewRoutes.js`

*(Note: All pages share the global navigation and footer styled in `assets/css/main.css`)*



---

## Installation setup Instructions & How to Run the Project
To run this application locally on your machine, follow these exact steps:

1. Extract the `.zip` file.
2. Navigate to the root folder.
3. Open the terminal in vs code, Ctr C to clear out all the cache (just in case), type " cd game-merch ", and then type " node server.js ", you should see a line "Server is running at http://localhost:3000", copy the http and paste it to your browser. 
4. Navigate through the top menu to access different modules built by the team.
---


## 📌 References
* Icons provided by [Remix Icon](https://remixicon.com/)
* Fonts provided by [Google Fonts](https://fonts.google.com/)
* Images sourced from: 
* https://store.gryphline.com/ 
* https://hollowknight-merch.com/ 
* https://www.leagueoflegends.com/en-us/news/merch/

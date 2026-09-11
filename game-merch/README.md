# LootBox. - E-commerce & Community Platform for Game Merchandises

## Academic Information

- **Institution:** RMIT University
- **Course:** [COSC3060 Web Programming]
- **Assignment:** Assessment Task 2 - Web application prototype

## Team Members (Group HN-G2)

This project was collaboratively built by a team of 5 members. Each member was responsible for a specific functional module of the website.

| Student ID | Full Name | Role / Module |
| s4195745 | Nguyen The Chinh | Shopping Cart, User Account Management |
| s4077090 | Hoang Xuan Quynh | Wishlist, User Account Management |
| s4197975 | Dang Viet Hoang | Discussion Forum, Administrator |
| s4200917 | Ho Nguyen Thanh | Blog, Administrator |
| s4199811 | Pham Khanh An | Product Review, User Account Management |

---

## 📝 Project Description

LootBox is a website prototype for a gaming merchandise marketplace.The platform integrates a shopping experience with community features, allowing users to browse products, read blogs, participate in forum discussions, and manage their personal accounts.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS (Embedded JavaScript templating), HTML5, CSS3, Vanilla JS
- **Database:** MongoDB Atlas (Mongoose)
- **Authentication:** Express-Session

---

## 📂 Module Details & File Structure

### 1. Shopping Cart and User Account Management (Nguyen The Chinh)

Handles Shopping Cart, User authenticater.
**View:**

- Shopping Cart (modules/shopping_cart): `shop.ejs`,`cart.ejs`, `checkout.ejs`, `product-detail.ejs`,`confirmation.ejs`
- User authenticater (modules/shared_module): `login.ejs`, `register.ejs`, `forgot_password.ejs`, `forgot_password_confimation.ejs`, `change_password.ejs`, `edit_profile.ejs`, `verify_password.ejs`, `profile.ejs`, `verify_password_confirm.ejs`.

**assets/css:**
`assets/css/auth.css`, `assets/css/cart.css`, `assets/css/main.css`, `assets/css/landing_page.css`

**assets/js:** `auth-validation.js`, `cartscript.js`, 

**routes:** `authRoutes.js`, `cartRoutes.js`

**middleware/controllers:** `authController.js`, `cartController.js`, `validation.js`, `auth.js`

**model:** `user.js`, `cart.js`, `order.js`

**Others:** `index.ejs`

### 2. Discussion Forum and Administrator (Dang Viet Hoang)

Handles community discussion threads, comments/replies, thread interactions (tym/heart), and thread management. 
**View**
* Discussion Forum (modules/forum): `forum.ejs`, `thread_detail.ejs`, `new_thread.ejs`, `edit_thread.ejs` 
* Admin: (modules/admin): `UserManager.ejs`

**assets/css:**
 `assets/css/forum.css` 

**assets/js:**  
`forumscript.js` , `adminscript.js`

**routes:**
` forumRoutes.js` 

**models:** 
` thread.js`


### 3. Wistlist (Hoang Xuan Quynh)

Handles User's wishlist and profile.

- Wistlist (modules/wishlist): `wishlist.html`
- **CSS:** `assests/css/main`, `assets/css/wistlist.css`, `assets/css/auth.css`

### 4. Blog and Administrator (Ho Nguyen Thanh)

**View**
* Blog(modules/blog): `blog.ejs`, `UserBlog.ejs`
* Admin(modules/admin): `UserManager.ejs`

**assets/css:**
`admin-blog-delete.css`, `blog-accessiblity.css`, `blog.css`

**assets/js**
`adminscript.js`, `blog-accessiblity.js`, `BlogAttr.js`, `blogscript.js`

**routes**
`blogRoutes.js`

**models:** 
`blog.js`



### 5. Product Review and User Account Management (Pham Khanh An)

Allows users to read and leave reviews for merchandise.

- Product Review (modules/review): `review.html`,
- **CSS:** `assests/css/main`, `assets/css/productreview.css`, `assets/css/auth.css`

---

- Global/Shared file: `server.js`, `main.css.`, `viewroute.js`, `mockDB.js`, `seed.js`,
  `view/partials`.

## 🚀 Installation & Deployment Instructions (Running on other Servers/Environments)

To deploy or run this application on a new server machine or local environment, follow these exact steps:

### 1. Prerequisites

Ensure the target machine has the following installed:

- **Node.js** (v14 or higher recommended)
- **MongoDB Atlas Account** (or a local MongoDB server)

### 2. Prepare the Environment

1. Extract the project `.zip` file or clone the repository.
2. Open your terminal and navigate to the project root folder:
   ```bash
   cd path/to/game-merch
   ```

### 3. Install Dependencies

Before running the app, you must install the required Node.js packages (`express`, `mongoose`, `bcrypt`, etc.). Run:

```bash
npm install
```

### 4. Configure Environment Variables

The application requires a connection to a MongoDB database to run successfully.

1. In the `game-merch` root folder, create a new file named exactly `.env` (with no filename before the dot).
2. Open `.env` and add your MongoDB connection string like this:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
   ```
   _(Replace `<username>`, `<password>`, `<cluster-url>`, and `<database-name>` with your actual MongoDB Atlas credentials. Make sure you have whitelisted the server's IP address in your MongoDB Atlas Network Access settings!)_

## Note: "To test the application with pre-populated products, forum posts, and mock users, please create a .env file in the root directory and use our team's hosted MongoDB connection string: MONGODB_URI=mongodb+srv://nguyenthechinh2807_db_user:LootBoxAdmin2026@cluster0.tw7nk82.mongodb.net/LootBoxDB?retryWrites=true&w=majority&appName=Cluster0"

### 5. Start the Server

Once the packages are installed and the database is configured, start the application:

```bash
node server.js
```


- If successful, you will see `Successfully connected to MongoDB Atlas!` and `Server is running at http://localhost:3000`.
- Open a web browser and navigate to `http://localhost:3000` (or your server's public IP address/domain) to access the application.

---

## Instruction for Testing

- Shopping cart: Create an account in the landing page, and then click the shop right on the nav bar (or anywhere that have the shop now button), you should see 3 mock product, click each one and select color, size as you prefer. After the selection, click onto the cart ( the right corner on the nav bar, it should show how many product you have), you will be in cart page, you can increase/decrease the quantity, sort item by name or filter item by price, A-Z, etc... After finish in the cart page, you go to the check out page, you MUST enter the right input, only then you will move to the confirmation page, which include all of your ealier products that you bought. Confirm and you will go back to the shop page.

- User Account Management: Go to landing page and create an account (or log in the account in the mockDB.js ), After Created, you should move to the edit profile page, you can upload an avatar, change your name or gmail. you can delete your account with password confirmation. If you wish to change your password, you can change it right on that page with password confirmation also. For the forgot password, click forgot password on login page, enter your email and it should show you the code was sent.

- Administration: Go to the landing page and login to the admin account, admin@lootbox.com/AdminPassword1. You should go directly to the admin page. Here you can lock/unlock all the account, to check you can go back to the login page and enter thier gmail/password. Other actions that admin can do is to delete posts on forum and blog, just go there with your admin account and you should see a clear delete button for each post.

- Discussion forum: Create an account or log in from the navigation bar, then click the Forum tab on the navigation bar. You should see existing discussion threads; try searching by keyword in the search bar or sorting threads by Newest or Oldest. Click on the Ask a question button, enter the required title and content, select a category, and optionally attach an image before clicking submit. Once published, the feed will update with your new thread at the top. Click into your thread to view the full discussion, type a comment in the reply box, and submit to see it appended immediately. Finally, test the Edit button to update your thread content, or use the Delete button to remove the thread after confirming the prompt.

- Wishlist:
  Log in with a demo account (e.g. nguyenthechinh2807@gmail.com / Password123!), then go to /wishlist.
  Confirm the two seeded items load, each showing product image, name, price, and status (Saved/Purchased).
  Type in the search box — list should filter live by product name, no page reload.
  Change the Sort and Status dropdowns — list should reorder/filter instantly.
  Refresh the page — the last search/sort/filter should still be applied (sessionStorage).
  Click Move to Cart on an item — it should disappear from the wishlist and appear in the cart badge/count.
  Click Mark as Purchased on an item — its status badge should update to "Purchased".
  Click Remove on an item — it should disappear immediately.
  Try adding the same product to the wishlist twice (e.g. from a product page) — second attempt should be blocked with a "already in your wishlist" message.
  Log out and visit /wishlist directly — should show the login prompt instead of the item grid.

- Blog: 
 create an account/log in.
go to blog page, click on “Read More” to open up the content of a blog post. Press “Read Aloud” to have TTS read out the content of the blog post. Click “Close” or “Show less” to stop the TTS.
Use the search bar to search for specific blog post
Title: “Lea” - Should show 2 posts.
Author - “GamerUser” Should show 1 post.
Slider panel on the right to cusomize the site to your liking. Text size and blog width update dynamically whilst TTS should restart when volume is changed. 
Go to “Your Blog” to bring up a personal blog page. Write a post and submit then return to the main feed to see the newly uploaded post.
Return to “Your Blog” and scroll down to Your Posts and click on the 3 dots to edit a post, save changes then return to the main feed to see the updated blog.
Return to “Your Blog” and scroll down to Your Posts and click on the 3 dots to delete a post, return to the main feed to see the blog post has been removed.
Log in as Admin, open the Blog page and delete any post. It should be removed




## 📌 References

- Icons provided by [Remix Icon](https://remixicon.com/)
- Fonts provided by [Google Fonts](https://fonts.google.com/)
- Images sourced from:
- https://store.gryphline.com/
- https://hollowknight-merch.com/
- https://www.leagueoflegends.com/en-us/news/merch/

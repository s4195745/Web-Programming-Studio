# LootBox. - E-commerce & Community Platform for Game Merchandises

## Academic Information
* **Institution:** RMIT University
* **Course:** [COSC3060 Web Programming]
* **Assignment:** Assessment Task 2 - Web application prototype

## Team Members (Group HN-G2)
This project was collaboratively built by a team of 5 members. Each member was responsible for a specific functional module of the website.

| Student ID | Full Name          | Role / Module                            |
| s4195745   | Nguyen The Chinh   | Shopping Cart, User Account Management   |
| s4077090   | Hoang Xuan Quynh   | Wishlist                                 |
| s4197975   | Dang Viet Hoang    | Discussion Forum,  Administrator         |
| s4200917   | Ho Nguyen Thanh    | Blog, Administrator                      |
| s4199811   | Pham Khanh An      | Product Review                           |

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
 **View:** 
* Shopping Cart (modules/shopping_cart): `shop.ejs`,`cart.ejs`, `checkout.ejs`, `product-detail.ejs`,`confirmation.ejs`
* User authenticater (modules/shared_module): `login.ejs`, `register.ejs`, `forgot_password.ejs`, `forgot_password_confimation.ejs`, `change_password.ejs`, `edit_profile.ejs`, `verify_password.ejs`, `profile.ejs`, `verify_password_confirm.ejs`.

**assets/css:** 
`assets/css/auth.css`, `assets/css/cart.css`, `assets/css/main.css`, `assets/css/landing_page.css`

**assets/js:** 
`auth-validation.js`, `cartscript.js`

**routes:** `authRoutes.js`, `cartRoutes.js`

**Others:**  `index.ejs` `data/mockDB.js` 


### 2. Discussion Forum  and Administrator (Dang Viet Hoang)
Community area for users to discuss gaming and related topics.
* Disscussion Forum (modules/discussion_forum): `forum.ejs`, `new_thread.ejs`,`thread_detail.ejs`, `edit_thread.ejs`
* Sitemap (views/modules/sitemap):  `sitemap.ejs`
* **CSS:** `assets/css/forum.css` 

### 3. Wistlist (Hoang Xuan Quynh)
Handles User's wishlist and profile. 
* Wistlist (modules/wishlist): `wishlist.html`
* **CSS:** `assests/css/main`, `assets/css/wistlist.css`, `assets/css/auth.css`

### 4. Blog and Administrator (Ho Nguyen Thanh)
Handles news and updates, Admin page.
* adminscript.js, blogscript.js, blog.ejs. UserBlog.ejs, posts.json, admin.css, blog.css 

### 5. Product Review and User Account Management (Pham Khanh An)
Allows users to read and leave reviews for merchandise.
* Product Review (modules/review): `review.html`,
* **CSS:** `assests/css/main`, `assets/css/productreview.css`, `assets/css/auth.css` 
---

* Global/Shared file: `server.js`, `main.css.`, `viewroute.js`, `mockDB.js`. 

## Installation setup Instructions & How to Run the Project
To run this application locally on your machine, follow these exact steps:

1. Extract the `.zip` file.
2. Navigate to the root folder.
3. Open the terminal in vs code, Ctr C to clear out all the cache (just in case), type " cd game-merch " (just in case again), and then type " node server.js ", you should see a line "Server is running at http://localhost:3000", copy the http and paste it to your browser. 
4. Navigate through the top menu to access different modules built by the team.
---

## Instruction for Testing 

* Shopping cart: Create an account in the landing page, and then click the shop right on the nav bar (or anywhere that have the shop now button), you should see 3 mock product, click each one and select color, size as you prefer. After the selection, click onto the cart ( the right corner on the nav bar, it should show how many product you have), you will be in cart page, you can increase/decrease the quantity, sort item by name or filter item by price, A-Z, etc... After finish in the cart page, you go to the check out page, you MUST enter the right input, only then you will move to the confirmation page, which include all of your ealier products that you bought. Confirm and you will go back to the shop page.

* User Account Management: Go to landing page and create an account (or log in the account in the mockDB.js ), After Created, you should move to the edit profile page, you can upload an avatar, change your name or gmail. you can delete your account with password confirmation. If you wish to change your password, you can change it right on that page with password confirmation also. For the forgot password, click forgot password on login page, enter your email and it should show you the code was sent. 

* Administration: Go to the landing page and login to the admin account, admin@lootbox.com/AdminPassword1. You should go directly to the admin page. Here you can lock/unlock all the account, to check you can go back to the login page and enter thier gmail/password. Other actions that admin can do is to delete posts on forum and blog, just go there with your admin account and you should see a clear delete button for each post. 

* Discussion forum: Create an account or log in from the navigation bar, then click the Forum tab on the navigation bar. You should see existing discussion threads; try searching by keyword in the search bar or sorting threads by Newest or Oldest. Click on the Ask a question button, enter the required title and content, select a category, and optionally attach an image before clicking submit. Once published, the feed will update with your new thread at the top. Click into your thread to view the full discussion, type a comment in the reply box, and submit to see it appended immediately. Finally, test the Edit button to update your thread content, or use the Delete button to remove the thread after confirming the prompt. 

* Wishlist:
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





## 📌 References
* Icons provided by [Remix Icon](https://remixicon.com/)
* Fonts provided by [Google Fonts](https://fonts.google.com/)
* Images sourced from: 
* https://store.gryphline.com/ 
* https://hollowknight-merch.com/ 
* https://www.leagueoflegends.com/en-us/news/merch/

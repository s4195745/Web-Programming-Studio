# LootBox. - E-commerce & Community Platform for Game Merchandises

## Academic Information
* **Institution:** RMIT University
* **Course:** [COSC3060 Web Programming]
* **Assignment:** Assignment 1 - Static Website (HTML/CSS)

## Team Members (Group HN-G2)
This project was collaboratively built by a team of 5 members. Each member was responsible for a specific functional module of the website.

| Student ID | Full Name          | Role / Module                           |
| s4195745   | Nguyen The Chinh   | Shopping Cart, User Account Management  |
| s4077090   | Hoang Xuan Quynh   | Wishlist, User Account Management       |
| s4197975   | Dang Viet Hoang    | Discussion Forum, Sitemap               |
| s4200917   | Ho Nguyen Thanh    | Blog, Administrator                     |
| s4199811   | Pham Khanh An      | Product Review, User Account Management |

---

## 📝 Project Description
LootBox is a website prototype for a gaming merchandise marketplace.The platform integrates a shopping experience with community features, allowing users to browse products, read blogs, participate in forum discussions, and manage their personal accounts.

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
* Disscussion Forum (modules/discussion_forum): `forum.html`, `new_thread.html`,`thread_detail.html`
* Sitemap (modules/shared_module): `sitemap.html`
* Others: SHARED FOOTER,
* **CSS:** `assests/css/main`, `assets/css/forum.css` 

### 3. Wistlist and User Account Management (Hoang Xuan Quynh)
Handles User's wishlist and profile. 
* Wistlist (modules/wishlist): `wishlist.html`
* Profile (modules/shared_module): `profile.html`, `edit_profile.html`, `verify_password.html`, `delete_account.html`
* **CSS:** `assests/css/main`, `assets/css/wistlist.css`, `assets/css/auth.css`

### 4. Blog and Administrator (Ho Nguyen Thanh)
Handles news and updates, Admin page.
* Blog (modules/blog): `blog.html`, `blog1Blog.html`,`blog2Blog.html`,`UserBlog.html`,
* Administrator (modules/shared_module): `admin.html`
* **CSS:** `assests/css/main`, `assets/css/blog.css`, `assets/admin.css` 

### 5. Product Review and User Account Management (Pham Khanh An)
Allows users to read and leave reviews for merchandise.
* Product Review (modules/review): `review.html`,
* Profile (modules/shared_module): `profile.html`, `edit_profile.html`, `verify_password.html`, `delete_account.html`
* **CSS:** `assests/css/main`, `assets/css/productreview.css`, `assets/css/auth.css` 

*(Note: All pages share the global navigation and footer styled in `assets/css/main.css`)*

---

## 🚀 How to Run the Project
1. Extract the `.zip` file.
2. Navigate to the root folder.
3. Open `landing_page.html` in any modern web browser (Google Chrome, Firefox, Safari, Edge) to start exploring the website.
4. Navigate through the top menu to access different modules built by the team.

---

## 🛠️ Technologies Used
* Semantic **HTML5**
* Custom **CSS3** 
* **Remix Icon / FontAwesome** (for static vector icons)
* **Google Fonts** (Outfit typography)

## 📌 References
* Icons provided by [Remix Icon](https://remixicon.com/)
* Fonts provided by [Google Fonts](https://fonts.google.com/)
* Images sourced from: 
* https://store.gryphline.com/ 
* https://hollowknight-merch.com/ 
* https://www.leagueoflegends.com/en-us/news/merch/

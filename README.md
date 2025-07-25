# ShopEase —> Grocery Store Management System | React Native, MySQL, Express
——————————————————————————————————————————————————————————————————————————————

ShopEase is a full-stack, cross-platform grocery management solution built with React Native via Expo, Express.js, and MySQL. 
Designed for both Web and mobile (Android/iOS), it enables users to browse groceries by location, place orders, 
and track history—while administrators manage categories and products with full CRUD features and oversee user-order data.

—————————————————————————————————————————
Developed a secure grocery store system:
—————————————————————————————————————————

* Clients can browse items purchase groceries, perform CRUD Operation with location and view order history.
* Admins can perform full CRUD on categories/products and monitor userLogs, user and order details.

——————————————————————— 
Tech & Infrastructure:
———————————————————————

* Backend (API Layer) ——
----------------------
Developed using Express.js; designed secure RESTful services with JWT and role-based access control.
Utilized middleware for CORS, encryption, and validation.
Integrated multer for media upload, Nodemailer for email automation, and Redis caching for fast session/token handling.

* Database (MySQL) ——
-------------------
Robust relational schema managing users, products, categories, orders, carts, payments, and activity logs.
Foreign keys enforce referential integrity, while normalized design and indexed keys support efficient joins and scalable query performance.

* Frontend (Client & Admin) ——
-----------------------------
Built using Expo-managed React Native to deliver a polished, cross-platform UI for Android, iOS, and Web.
Technologies include AsyncStorage for persistent local storage, React Navigation (native-stack) with metro-runtime, Axios for API access,
and UI libraries like React Native Paper, gesture-handler, reanimated, and vector-icons for responsive and seamless UX.

———————————————————————
Dev Tools & Libraries:
———————————————————————
* Backend: bcrypt, crypto, cors, jsonwebtoken, multer, mysql2, nodemailer, redis.
* Frontend: expo-status-bar, axios, react-dom, react-native-web, and related modules.


ShopEase delivers a polished, end-to-end solution for grocery retail, integrating a Cross platform user application, admin interface, secure backend, and efficient database—all built for maintainability, scalability, and future innovation
This architecture aligns with best practices seen in full-stack grocery and e-commerce apps (e.g., React Native + Express/MongoDB setups)

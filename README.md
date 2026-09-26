# AdapterHub

**Custom WordPress & WooCommerce website for car audio speaker adapters and accessories.**

> 🚧 **Status:** In development

---

## 📌 Overview

AdapterHub is an e-commerce project focused on **car-specific speaker adapters and accessories**.

The project combines a custom responsive frontend with WooCommerce and custom WordPress development. The goal is to provide a clean shopping experience while making it easy for customers to find compatible adapters for their vehicle.

---

## ✨ Features

- 📱 Responsive, mobile-first design
- 🛒 Custom WooCommerce shop experience
- 🚗 Car brand navigation
- ⭐ Featured products
- 🔧 Custom adapter requests
- 🧭 Responsive navigation
- 📧 Newsletter signup section
- 💬 Customer testimonials
- 🎨 Custom product presentation
- 🛍️ WooCommerce product integration

---

## 🛠️ Custom Development

### AdapterHub Core

A custom WordPress plugin developed specifically for the project.

**Responsibilities include:**

- Custom car brand functionality
- WooCommerce product components
- Custom shortcodes
- AdapterHub-specific frontend functionality

### AdapterHub Child Theme

A custom child theme built on top of **Hello Elementor**.

**Includes:**

- Custom global styling
- Responsive layouts
- WooCommerce styling
- Shop-specific styles
- Custom frontend components

---

## 💻 Tech Stack

| Technology      | Usage                        |
| --------------- | ---------------------------- |
| WordPress       | CMS                          |
| WooCommerce     | E-commerce                   |
| Elementor       | Page building                |
| PHP             | Custom WordPress development |
| CSS             | Frontend styling             |
| JavaScript      | Frontend functionality       |
| MySQL / MariaDB | Database                     |

---

## 📁 Project Structure

```text
wp-content/
├── plugins/
│   └── adapterhub-core/
│       ├── adapterhub-core.php
│       └── readme.txt
│
└── themes/
    └── adapterhub-child/
        ├── functions.php
        ├── style.css
        └── shop-style.css
```

---

## 🧩 Development Approach

The project separates **presentation** from **functionality** where practical.

- Global AdapterHub styles are maintained in the child theme.
- WooCommerce Shop-specific styles are isolated in `shop-style.css`.
- Custom functionality is maintained in the `AdapterHub Core` plugin rather than being tied to the theme.
- WooCommerce remains the source of truth for products and product data.

This structure makes the custom code easier to maintain and reuse.

---

## 🎨 Design

The website uses a clean, minimal visual system focused on:

- Clear product presentation
- Easy navigation
- Strong visual hierarchy
- Responsive layouts
- Consistent spacing and typography
- Simple car-specific product discovery

---

## 🚧 Current Status

The project is actively being developed.

### Current focus

- WooCommerce Shop
- Product pages
- Car brand navigation
- Custom adapter request flow
- Supporting pages
- Responsive refinement

---

## 🔐 Repository Scope

This repository contains the **custom source code developed for AdapterHub**.

The following are intentionally excluded:

- WordPress core
- Third-party plugins
- Uploaded media
- Local configuration
- Database data
- Cache and generated files
- Credentials and secrets

A local WordPress installation and database are required to run the complete project.

---

## 📸 Portfolio

AdapterHub is being developed as a portfolio project demonstrating:

- WordPress development
- WooCommerce customization
- PHP
- CSS
- Responsive frontend development
- Custom plugin architecture
- Theme development
- UI implementation

---

## 👤 Author

Jacek Witucki

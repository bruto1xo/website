# Personal Portfolio Website

A modern, responsive personal portfolio website built with HTML, CSS, and JavaScript. Features a beautiful design with smooth animations, mobile-friendly navigation, and a working contact form.

## ✨ Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI/UX**: Clean, professional design with beautiful gradients and animations
- **Smooth Animations**: Scroll-triggered animations and interactive effects
- **Mobile Navigation**: Hamburger menu for mobile devices
- **Contact Form**: Functional contact form with validation
- **Fast Loading**: Optimized for performance
- **SEO Friendly**: Semantic HTML structure
- **Cross-Browser Compatible**: Works on all modern browsers

## 🚀 Quick Start

1. **Clone or download** this repository
2. **Customize** the content in `index.html` with your own information
3. **Open** `index.html` in your web browser
4. **Deploy** to your preferred hosting platform

## 📝 Customization Guide

### Personal Information

Edit the following sections in `index.html`:

#### 1. Basic Information
- **Name**: Replace "Your Name" in the navigation and hero section
- **Title**: Update "Full Stack Developer & Creative Problem Solver"
- **Description**: Modify the hero description paragraph
- **Contact Info**: Update email, phone, and location in the contact section

#### 2. About Section
- Update the about text with your own story
- Modify the statistics (projects completed, years of experience, etc.)

#### 3. Skills Section
- Add/remove/modify the skill categories and items
- The skills are organized into Frontend, Backend, and Tools & DevOps

#### 4. Projects Section
- Replace the example projects with your own
- Update project titles, descriptions, technologies used
- Add links to your GitHub repositories and live demos

#### 5. Contact Information
- Update email address, phone number, and location
- Add links to your social media profiles (GitHub, LinkedIn, Twitter, Instagram)

### Styling Customization

Edit `styles.css` to customize:

#### Colors
The website uses a blue-purple gradient theme. To change colors, update these CSS variables:
```css
/* Main gradient colors */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* You can replace with your preferred colors, for example: */
background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
```

#### Typography
The website uses the Inter font family. To change fonts:
```css
font-family: 'Your-Preferred-Font', sans-serif;
```

#### Layout
Modify spacing, sizing, and layout properties in the CSS file.

## 🖼️ Adding Your Own Images

### Profile Image
The website currently uses a Font Awesome icon for the profile avatar. To add your own image:

1. Add your image file to the project folder
2. Replace the hero avatar section in `index.html`:
```html
<!-- Replace this -->
<div class="hero-avatar">
    <i class="fas fa-user-circle"></i>
</div>

<!-- With this -->
<div class="hero-avatar">
    <img src="your-image.jpg" alt="Your Name">
</div>
```

3. Update the CSS for `.hero-avatar img`:
```css
.hero-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}
```

### Project Images
Replace the Font Awesome icons in project cards with actual project screenshots:
```html
<div class="project-image">
    <img src="project-screenshot.jpg" alt="Project Name">
</div>
```

## 📱 Mobile Optimization

The website is fully responsive and includes:
- Mobile-friendly navigation with hamburger menu
- Optimized layouts for different screen sizes
- Touch-friendly buttons and interactive elements
- Readable typography on small screens

## 🔧 Advanced Customization

### Adding New Sections
To add a new section:

1. Add the section HTML to `index.html`
2. Add a navigation link in the navbar
3. Style the section in `styles.css`
4. Add any JavaScript functionality in `script.js`

### Modifying Animations
The website includes several animations:
- **Scroll animations**: Elements fade in as you scroll
- **Typing animation**: Hero subtitle types out on page load
- **Hover effects**: Cards and buttons have hover animations
- **Floating animation**: Profile avatar has a floating effect

Modify these in `styles.css` and `script.js`.

## 🚀 Deployment Options

### 1. GitHub Pages (Free)
1. Create a GitHub repository
2. Upload your files
3. Go to Settings > Pages
4. Select source branch (usually `main`)
5. Your site will be available at `https://yourusername.github.io/repository-name`

### 2. Netlify (Free)
1. Drag and drop your project folder to [Netlify](https://netlify.com)
2. Your site will be deployed automatically
3. Custom domain available

### 3. Vercel (Free)
1. Connect your GitHub repository to [Vercel](https://vercel.com)
2. Automatic deployments on every commit
3. Custom domain available

### 4. Traditional Web Hosting
Upload all files to your web hosting provider via FTP.

## 📁 File Structure

```
your-website/
│
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
├── README.md           # This file
└── .gitignore         # Git ignore file
```

## 🛠️ Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

## 🤝 Contributing

Feel free to fork this project and make it your own! If you have suggestions for improvements, please open an issue or submit a pull request.

## ⭐ Features to Add (Optional)

Here are some features you might want to add:

- **Blog section**: Add a blog to showcase your writing
- **Resume download**: Add a button to download your resume
- **Dark mode toggle**: Add a dark/light theme switcher
- **Loading screen**: Add a preloader animation
- **More animations**: Add more scroll-triggered animations
- **CMS integration**: Connect to a content management system
- **Analytics**: Add Google Analytics or similar

## 🔗 Useful Resources

- [Font Awesome Icons](https://fontawesome.com/icons) - For additional icons
- [Google Fonts](https://fonts.google.com/) - For different fonts
- [CSS Gradient Generator](https://cssgradient.io/) - For custom gradients
- [Unsplash](https://unsplash.com/) - For high-quality free images
- [CSS Grid Generator](https://cssgrid-generator.netlify.app/) - For custom grid layouts

---

**Happy coding! 🚀** Make this website truly yours by customizing it with your personal information, projects, and style preferences.
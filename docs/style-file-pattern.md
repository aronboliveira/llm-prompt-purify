[MODULES]:
- For styles that apply ONLY to specific elements (like toast and popups) that mount/unmount frequently, you can place them write them as .module.scss and place into a dedicated folder for module styles;
[SCSS-AT-RULES]:
- Leverage @function, @mixin (or %placeholders, but prefer mixin in most cases if cleaner or less verbose);
[CSS-AT-RULES]:
- Leverage @position-try, @container, @media (include coarse, colors-scheme and width) for optimizing UI/UX;
- Consider using @scope+:scope if selectors are very specific to a html component and must be contained within this area of the page;

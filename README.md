# Lets Watch!

Lets Watch! is a web application designed to provide an enjoyable anime series and movies watching experience. It features a responsive interface and integrates various
technologies to enhance user interaction and accessibility while providing the fastest loading speed possible.

## Table of Contents

-   [Installation](#installation)
-   [Usage](#usage)
-   [Project Structure](#project-structure)
-   [Functions](#functions)
-   [Logged In Users](#logged-in-users)
-   [License](#license)

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/yusuftuncay/Letswatch.git
    ```

2. Navigate to the project directory:

    ```bash
    cd Letswatch
    ```

3. Open `index.html` in your preferred web browser

## Usage

-   Open `index.html` to start the application
-   Navigate through the UI to explore various features
-   Customize the content by modifying the files in the `html`, `css`, and `js` directories

## Project Structure

-   **css**: Contains all stylesheets used in the application
-   **font**: Includes a font file required for the application
-   **html**: Contains the HTML files that define the structure of the application
-   **img**: Holds image assets used throughout the application
-   **js**: JavaScript files that add interactivity and dynamic content to the application
-   **index.html**: The main entry point for the application

## 🔧 Features

- **No ads**
- Full user authentication
- Browse, search, and watch all anime series and movies
- View detailed anime info, including:
  - Previously watched episodes highlighted in **dark grey**
  - Currently watching episode highlighted in **green**
  - Filler episodes marked in **red**
- Stream video content with (With many more in the VideoPlayer):
  - **Skip intro/outro** buttons
  - **Next episode** button
  - **Subbed/Dubbed** selection dropdown
- Minimalistic and clean UI
- Fully responsive across all devices
- AniList sync support (login via **Account** section)
- Resume playback from where you left off
  - Shown in **Recently Watched** on the home screen

## Logged In Users

Logged in users can:

-   Track anime progress (Showing a "Recently Watched" section on the homepage with the image, title, episode number and a progress bar)
-   Saves any progress on their account
-   When clicked on an anime in the "Recently Watched" section, the player automatically starts at the correct episode and time, resuming playback from where they left off

## APIs Used

- [Aniwatch API](https://github.com/ghoshRitesh12/aniwatch-api)
- [Consumet API](https://github.com/consumet/api.consumet.org)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information

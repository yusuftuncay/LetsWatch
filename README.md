# Let's Watch!

**Let's Watch!** is a web application designed to provide an enjoyable experience for watching anime series and movies. It features a responsive interface and integrates various technologies to enhance user interaction and accessibility, while delivering the fastest loading speeds possible.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Features](#features)
- [Logged-in Users](#logged-in-users)
- [APIs Used](#apis-used)
- [License](#license)

## Installation

To set up the project locally:

1. Clone the repository:

    ```bash
    git clone https://github.com/yusuftuncay/LetsWatch.git
    ```

2. Navigate to the project directory:

    ```bash
    cd LetsWatch
    ```

3. Additional setup needed for firebase, cors, proxy, ...

4. Open `index.html` in your preferred web browser.

## Usage

- Open `index.html` to launch the application.
- Navigate through the UI to explore available features.
- Customize content by modifying files in the `html`, `css`, and `js` directories.

## Project Structure

- **css/** – Stylesheets for the application.
- **font/** – Required font files.
- **html/** – HTML files defining the app structure.
- **img/** – Image assets.
- **js/** – JavaScript files for interactivity.
- **index.html** – Main entry point of the app.

## Features

- **No ads**
- Full user authentication:
  - Update email or password.
  - Delete your account.
- Browse, search, and watch all anime series and movies.
- Detailed anime info with:
  - **Dark grey** – Previously watched episodes.
  - **Green** – Currently watching episode.
  - **Red** – Filler episodes.
- Stream video content with:
  - **Skip intro/outro** buttons.
  - **Next episode** button.
  - **Subbed/Dubbed** dropdown.
- Minimalistic and clean UI.
- Fully responsive across all devices.
- AniList sync support (login via **Account** section).
- Resume playback from where you left off:
  - Shown in **Recently Watched** on the home screen.

## Logged-in Users

Logged-in users can:

- Track anime progress:
  - Shown in the **Recently Watched** section with image, title, episode number, and a progress bar.
- Save viewing progress to their account.
- Instantly resume watching by clicking any item in **Recently Watched**:
  - The player opens the correct episode and timestamp.

## APIs Used

- [Aniwatch API](https://github.com/ghoshRitesh12/aniwatch-api)
- [Consumet API](https://github.com/consumet/api.consumet.org)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

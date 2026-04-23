# tullingedk/booking/frontend

React frontend.

## Environment Variables

Define in a file named `.env`.

- `REACT_APP_BACKEND_URL` - backend base URL, e.g. `https://booking.tgdk.se` or `http://localhost:5000`

## GitHub Pages

This frontend can be deployed as a static site to GitHub Pages.

- Set the repository variable `REACT_APP_BACKEND_URL` to the public base URL of the backend API.
- Enable GitHub Pages in the repository settings and set the source to `GitHub Actions`.
- Push to the default branch to trigger the Pages deployment workflow.

The build uses relative asset paths, so it works when served from a project Pages URL such as `https://<user>.github.io/<repo>/`.

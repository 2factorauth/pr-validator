# PR Validator

A Cloudflare Worker project that validates domains and social media handles submitted via pull requests against specified criteria. This project uses the Twitter API, SimilarWeb, and other services to perform the validations.

## Project Description

The PR Validator is designed to validate domains and social media handles submitted via pull requests. The bot checks domain rankings, validates Facebook handles, and ensures that the submitted entries meet specified criteria.

## Setup

### Prerequisites

- Node.js and npm installed on your development machine
- Cloudflare Workers account

### Environment Variables

Set up the following environment variables in your Cloudflare Workers environment:

- `OWNER`: The GitHub repository owner
- `SIMILARWEB_RANK_LIMIT`: The maximum allowed SimilarWeb rank for a domain
- `SIMILARWEB_API_KEY`: Your SimilarWeb API key

You can set these environment variables in your Cloudflare Workers environment using the `wrangler` CLI or directly in the Cloudflare dashboard.

### Installation

1. Clone the repository:

    ```shell
    git clone https://github.com/2factorauth/pr-validator.git
    cd pr-validator
    ```

2. Install dependencies:

    ```shell
    npm install
    ```

3. Deploy to Cloudflare Workers:

    ```shell
    wrangler publish
    ```

## Usage

The bot is triggered via a GitHub workflow using cURL. It performs the following validations:

- **Domain Rank Validation:** Checks if the primary domain and any additional domains have a rank below the specified limit.
- **Facebook Handle Validation:** Validates the presence and correctness of a Facebook handle if provided.

### Example GitHub Workflow

Below is an example of a GitHub workflow that calls the PR Validator using cURL:

```yaml
name: Validate PR

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Call PR Validator
        run: |
          curl -X GET "https://<your-worker-url>/${{ github.event.repository.name }}/${{ github.event.number }}/" \
          -H "Content-Type: application/json"
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

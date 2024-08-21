# GPOW Nocturne Frontend

## Getting Started
To get started you need a few things installed on your machine. First, you need to install the nodejs. You can do this by following the instructions on the [Nodejs website](https://nodejs.org/en/download/package-manager/current).

Next, you need to download polkadot wallet extension in your browser. You can download it on [Polkadot website](https://polkadot.js.org/extension/)

After these follow these steps

- Clone the repo
```bash
  git clone https://github.com/Immutableai/gpow-nocturne-frontend
```
- Navigate to the project directory
```bash
    cd gpow-nocturne-frontend
```
- Install pnpm
```
    npm install -g pnpm
```
- Install the dependencies
```bash
    pnpm i
```
- Rename the .env.example to .env and put your actual keys

## Run in dev envorinment
```
    pnpm run dev
```

## Run in prod
- Build the app
```bash
    pnpm run build
```
- Run the app
```bash
    pnpm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
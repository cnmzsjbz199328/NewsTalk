# Cloudflare Load Balancer Setup Guide for Gradio TTS Models

## 1. Objective

This document provides a step-by-step guide to configure a Cloudflare Load Balancer to distribute traffic across your multiple, identical `Kokoro-TTS` Gradio server instances. This will improve the scalability, reliability, and performance of the application's text-to-speech feature.

---

## 2. Prerequisites

1.  **A Cloudflare Account:** Your domain name must be managed through Cloudflare.
2.  **Multiple TTS Servers:** You have two or more Gradio TTS servers running.
3.  **Server IP Addresses:** You have the public IP addresses for each of your Gradio servers (e.g., `192.0.2.1`, `192.0.2.2`, etc.).

---

## 3. Step-by-Step Configuration in Cloudflare

### Step 1: Add DNS Records for Your Servers (DNS Only)

First, we need to tell Cloudflare about your servers, but we want to keep them hidden from the public internet for better security.

1.  Navigate to your Cloudflare dashboard and select your domain.
2.  Go to the **DNS** -> **Records** section.
3.  For each of your server IPs, add an **`A` record**:
    *   **Type:** `A`
    *   **Name:** Give it a descriptive name, e.g., `gradio-tts-1`.
    *   **IPv4 address:** Enter the IP of your first server (e.g., `192.0.2.1`).
    *   **Proxy status:** **Crucially, turn the proxy OFF (click the orange cloud so it becomes grey).** This should say "DNS only". This prevents direct public access via this record.
4.  Repeat this for all your other TTS servers (e.g., `gradio-tts-2`, `gradio-tts-3`, etc.).



### Step 2: Create a Health Check

The load balancer needs to know which of your servers are healthy and able to accept requests.

1.  In the Cloudflare dashboard, go to **Traffic** -> **Health Checks**.
2.  Click **Create**.
3.  Configure the health check:
    *   **Name:** `Gradio TTS Health Check`
    *   **Monitor Type:** `HTTP`
    *   **Path:** `/` (The root path of a Gradio app should return a 200 OK status).
    *   **Check Regions:** Choose a few regions, preferably close to your servers.
4.  Leave the advanced settings as default for now and click **Save**.

### Step 3: Create an Origin Pool

An origin pool is a group of your servers that the load balancer can choose from.

1.  Go to **Traffic** -> **Load Balancing**.
2.  Click the **Origin Pools** tab, then click **Create Origin Pool**.
3.  Configure the pool:
    *   **Pool Name:** `Gradio-TTS-Servers`
    *   **Origins:**
        *   Click **Add Origin**.
        *   **Name:** `gradio-tts-1` (match the DNS record name).
        *   **Address:** Enter the IP address of your first server.
        *   **Weight:** Leave as `1`.
        *   Click **Add**.
    *   Repeat the "Add Origin" step for all your other server IPs.
    *   **Health Check:** In the dropdown, select the `Gradio TTS Health Check` you created in the previous step.
    *   **Health Check Threshold:** Set it to `1`. This means if at least one server is healthy, the pool is considered healthy.
4.  Click **Save**.

### Step 4: Create the Load Balancer

Now, we assemble everything into a functional load balancer.

1.  Go to **Traffic** -> **Load Balancing** and ensure you're on the **Load Balancers** tab.
2.  Click **Create Load Balancer**.
3.  Configure the load balancer:
    *   **Hostname:** This is the public URL you will use in your app. For example, `tts-api.yourdomain.com`.
    *   **Session Affinity:** **This is a critical step for Gradio.** Since a user's interaction can involve multiple API calls, you want them to "stick" to the same server for the duration of their task.
        *   Set **Session Affinity** to **`By Cloudflare Cookie`**. This ensures a user's requests are consistently routed to the same origin server.
    *   **Origin Pools:**
        *   In the "Default Origin Pools" section, click **Add Origin Pool**.
        *   Select the `Gradio-TTS-Servers` pool you created.
4.  Review your configuration and click **Save and Deploy**.

Cloudflare will now automatically create the necessary public DNS record for `tts-api.yourdomain.com` and start balancing traffic across your healthy servers.

---

## 4. Integrating the Load Balancer into Your Project

This is the final and simplest step. You just need to tell your application to use the new load balancer URL instead of the old, direct Hugging Face Space URL.

1.  **Open the file:** `services/ttsService.ts`

2.  **Locate this line:**
    ```typescript
    const TTS_SPACE_URL = "Tom1986/Kokoro-TTS" and “Tom0403309722/Kokoro-TTS”;
    ```

3.  **Replace it with the hostname you created in Step 4:**
    ```typescript
    // The new URL points to your Cloudflare Load Balancer
    const TTS_SPACE_URL = "https://tts-api.yourdomain.com"; 
    ```
    *Make sure to use `https` and replace `tts-api.yourdomain.com` with your actual hostname.*

4.  **Save the file.**

That's it! The `@gradio/client` library is smart enough to work with either a Hugging Face Space ID or a full URL. By making this single change, all TTS requests from your application will now be directed to your highly available, load-balanced collection of servers. No other code changes are required.

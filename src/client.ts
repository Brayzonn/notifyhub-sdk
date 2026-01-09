import axios, { AxiosInstance } from "axios";
import {
  NotifyHubConfig,
  SendEmailOptions,
  SendWebhookOptions,
  JobResponse,
  JobStatus,
  DomainStatusResponse,
  DomainVerificationResponse,
  DomainInfoResponse,
} from "./types";
import { NotifyHubError } from "./errors";

export class NotifyHubClient {
  private client: AxiosInstance;

  constructor(config: NotifyHubConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.notifyhub.com",
      headers: {
        "X-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => {
        const apiResponse = response.data.data;
        if (apiResponse.message) return apiResponse.message;
        return apiResponse;
      },
      (error) => {
        if (error.response) {
          const data = error.response.data;
          const statusCode = error.response.status;

          let message = error.message;
          let errors = null;

          if (data?.error) {
            if (Array.isArray(data.error)) {
              errors = data.error;
              message = data.error.join(", ");
            } else {
              message = data.error;
            }
          } else if (data?.message) {
            if (Array.isArray(data.message)) {
              errors = data.message;
              message = "Validation failed";
            } else {
              message = data.message;
            }
          }

          throw new NotifyHubError(message, statusCode, data, errors);
        }

        throw new NotifyHubError(error.message || "Network error occurred");
      }
    );
  }

  /**
   * Test API connection
   */
  async ping(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    return await this.client.get("/api/v1/ping");
  }

  /**
   * Get API information
   */
  async getApiInfo(): Promise<any> {
    return await this.client.get("/api/v1/info");
  }

  /**
   * Send an email notification
   */
  async sendEmail(options: SendEmailOptions): Promise<JobResponse> {
    return await this.client.post("/api/v1/notifications/email", options);
  }

  /**
   * Send a webhook notification
   */
  async sendWebhook(options: SendWebhookOptions): Promise<JobResponse> {
    return await this.client.post("/api/v1/notifications/webhook", options);
  }

  /**
   * Get job status by ID
   */
  async getJob(jobId: string): Promise<JobStatus> {
    return await this.client.get(`/api/v1/notifications/jobs/${jobId}`);
  }

  /**
   * List jobs with optional filters
   */
  async listJobs(options?: {
    page?: number;
    limit?: number;
    type?: "email" | "webhook";
    status?: "pending" | "processing" | "completed" | "failed";
  }): Promise<{ data: JobStatus[]; pagination: any }> {
    return await this.client.get("/api/v1/notifications/jobs", {
      params: options,
    });
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<JobResponse> {
    return await this.client.post(`/api/v1/notifications/jobs/${jobId}/retry`);
  }

  /**
   * Request domain verification
   */
  async requestDomainVerification(
    domain: string
  ): Promise<DomainVerificationResponse> {
    return await this.client.post("/api/v1/customers/domain/request", {
      domain,
    });
  }

  /**
   * Check domain verification status
   */
  async verifyDomain(): Promise<DomainStatusResponse> {
    return await this.client.post("/api/v1/customers/domain/verify");
  }

  /**
   * Get domain configuration status
   */
  async getDomainStatus(): Promise<DomainInfoResponse> {
    return await this.client.get("/api/v1/customers/domain/status");
  }

  /**
   * Remove domain configuration
   */
  async removeDomain(): Promise<{ message: string }> {
    return await this.client.delete("/api/v1/customers/domain");
  }
}

export interface ValidateRequest<T> {
  name: string;
  type: string;
  location: string;
  properties: T;
}

export interface ContainerValidationProperties {
  containerRegistryBaseUrl: string;
  containerRegistryUsername: string;
  containerRegistryPassword: string;
  containerImageRespository: string;
  containerImageTag: string;
  containerImagePlatform: string;
}

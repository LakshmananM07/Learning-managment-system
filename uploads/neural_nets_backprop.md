# Neural Networks & Backpropagation Notes
## Activation Functions
- **Sigmoid:** $\sigma(z) = \frac{1}{1 + e^{-z}}$, range (0, 1)
- **ReLU:** $f(z) = \max(0, z)$, solves vanishing gradient in positive domain
- **Softmax:** For multiclass classification probability distributions

## Loss Functions
- Binary Cross Entropy: $-\sum [y \log(\hat{y}) + (1-y)\log(1-\hat{y})]$
- Categorical Cross Entropy: $-\sum_{k} y_k \log(\hat{y}_k)$

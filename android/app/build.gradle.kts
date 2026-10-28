plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The app has the console app's version (app/version.js), so a release carries both under one number.
val versionParts = Regex("var VERSION = \"(\\d+)\\.(\\d+)\\.(\\d+)\"")
    .find(File(rootDir, "../app/version.js").readText())!!.groupValues.drop(1).map { it.toInt() }

android {
    namespace = "app.irdl.companion"
    compileSdk = 34

    defaultConfig {
        applicationId = "app.irdl.companion"
        minSdk = 26
        targetSdk = 34
        versionCode = versionParts[0] * 1000000 + versionParts[1] * 1000 + versionParts[2]
        versionName = versionParts.joinToString(".")
    }

    signingConfigs {
        // A fixed key, so every build installs over the last one (it is not a secret: this APK is a sideloaded hobby app).
        create("release") {
            storeFile = file("../irdl-companion.keystore")
            storePassword = "irdlcompanion"
            keyAlias = "irdl"
            keyPassword = "irdlcompanion"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.3")
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-core")
    implementation("io.coil-kt:coil-compose:2.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jsoup:jsoup:1.17.2")
}
